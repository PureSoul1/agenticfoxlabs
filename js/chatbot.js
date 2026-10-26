// frontend/js/chatbot.js — Enhanced Fox AI Chatbot
// Features: conversation history, timestamps, suggested responses,
//           ARIA live region, AbortController timeout, markdown bold

(function () {
  'use strict';

  const CHAT_API_URL = 'https://chat-api.agenticfoxlabs.com/api/chat';
  const REQUEST_TIMEOUT = 15000; // 15 seconds
  const MAX_HISTORY = 10; // Last 10 messages stored in sessionStorage

  let foxOpen = false;
  let foxTyping = false;
  let conversationHistory = [];

  // ── Suggested Responses ────────────────────────────────────────
  const SUGGESTED_RESPONSES = {
    pricing: { keywords: ['price', 'pricing', 'cost', 'plan', 'subscription', 'how much'], reply: 'What are your pricing plans?' },
    demo: { keywords: ['demo', 'trial', 'try', 'test', 'free'], reply: 'How can I book a free demo?' },
    erp: { keywords: ['erp', 'school', 'hospital', 'gym', 'clinic', 'real estate', 'construction'], reply: 'Tell me about your ERP solutions' },
    support: { keywords: ['support', 'help', 'contact', 'phone', 'whatsapp', 'call'], reply: 'How do I contact support?' },
    features: { keywords: ['feature', 'ai', 'automation', 'dashboard', 'analytics'], reply: 'What AI features do you offer?' }
  };

  function getSuggestedReplies(userMsg) {
    const lower = userMsg.toLowerCase();
    const suggestions = [];
    for (const key in SUGGESTED_RESPONSES) {
      const group = SUGGESTED_RESPONSES[key];
      if (group.keywords.some(kw => lower.includes(kw))) {
        suggestions.push(group.reply);
      }
    }
    return suggestions.slice(0, 3);
  }

  // ── Conversation History ───────────────────────────────────────
  function loadHistory() {
    try {
      const stored = sessionStorage.getItem('foxChatHistory');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) conversationHistory = parsed;
      }
    } catch (e) {
      conversationHistory = [];
    }
  }

  function saveHistory() {
    try {
      if (conversationHistory.length > MAX_HISTORY) {
        conversationHistory = conversationHistory.slice(-MAX_HISTORY);
      }
      sessionStorage.setItem('foxChatHistory', JSON.stringify(conversationHistory));
    } catch (e) {
      // sessionStorage might be full or blocked
    }
  }

  function addToHistory(role, text) {
    // Store 'assistant' instead of 'bot' for LLM compatibility
    const normalizedRole = role === 'user' ? 'user' : 'assistant';
    conversationHistory.push({ role: normalizedRole, content: text, timestamp: Date.now() });
    saveHistory();
  }

  // ── Timestamp & Formatting Helpers ─────────────────────────────
  function formatTime(ts) {
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── ARIA Live Region ───────────────────────────────────────────
  function ensureAriaLive() {
    let region = document.getElementById('foxAriaLive');
    if (!region && document.body) {
      region = document.createElement('div');
      region.id = 'foxAriaLive';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
      document.body.appendChild(region);
    }
    return region;
  }

  function announceMessage(text) {
    const region = ensureAriaLive();
    if (!region) return;
    region.textContent = '';
    setTimeout(() => { region.textContent = text; }, 100);
  }

  // ── Add Message ────────────────────────────────────────────────
  function foxAddMsg(text, type, timestamp) {
    const msgs = document.getElementById('foxMessages');
    if (!msgs) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'fox-msg ' + type;

    if (type === 'typing') {
      wrapper.innerHTML =
        '<div class="fox-typing-dots"><span></span><span></span><span></span></div>';
    } else {
      const safeText = escapeHtml(text);
      const formattedText = safeText
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      const timeStr = timestamp ? formatTime(timestamp) : formatTime(Date.now());

      wrapper.innerHTML =
        '<div class="fox-msg-bubble">' + formattedText + '</div>' +
        '<div class="fox-msg-time">' + timeStr + '</div>';
    }

    msgs.appendChild(wrapper);
    msgs.scrollTop = msgs.scrollHeight;
    return wrapper;
  }

  // ── Show Suggested Replies ─────────────────────────────────────
  function showSuggestions(suggestions) {
    const container = document.getElementById('foxQuickBtns');
    if (!container || !suggestions.length) return;

    container.innerHTML = '';
    container.style.display = 'flex';

    suggestions.forEach(text => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fox-quick-btn';
      btn.textContent = text;
      btn.onclick = () => window.foxQuickSend(text);
      container.appendChild(btn);
    });
  }

  // ── Toggle & Close Chat ────────────────────────────────────────
  function toggleChat() {
    foxOpen = !foxOpen;
    const chatWindow = document.getElementById('foxChatWindow');
    if (chatWindow) {
      chatWindow.classList.toggle('open', foxOpen);
    }

    if (foxOpen) {
      const input = document.getElementById('foxInput');
      if (input) input.focus();

      const notif = document.querySelector('.fox-notif');
      if (notif) notif.style.display = 'none';

      if (typeof gtag === 'function') {
        gtag('event', 'chat_opened', { source: 'floating_button' });
      }
    }
  }

  function closeChat() {
    foxOpen = false;
    const chatWindow = document.getElementById('foxChatWindow');
    if (chatWindow) chatWindow.classList.remove('open');
  }

  // Expose to window in case HTML uses inline onclick attributes
  window.foxToggleChat = toggleChat;
  window.foxCloseChat = closeChat;
  window.foxSendMessage = foxSendMessage;

  // ── Quick Send ─────────────────────────────────────────────────
  window.foxQuickSend = function (msg) {
    const input = document.getElementById('foxInput');
    if (input) input.value = msg;
    const quickBtns = document.getElementById('foxQuickBtns');
    if (quickBtns) quickBtns.style.display = 'none';
    foxSendMessage();
  };

  // ── Send Message ───────────────────────────────────────────────
  async function foxSendMessage() {
    if (foxTyping) return;

    const input = document.getElementById('foxInput');
    if (!input) return;

    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    input.style.height = 'auto';

    // Snapshot previous history BEFORE adding current user message
    const apiHistory = conversationHistory.slice(-MAX_HISTORY).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const now = Date.now();
    foxAddMsg(msg, 'user', now);
    addToHistory('user', msg);
    announceMessage('You: ' + msg);

    foxTyping = true;
    const sendBtn = document.getElementById('foxSendBtn');
    if (sendBtn) sendBtn.disabled = true;

    const typingEl = foxAddMsg('', 'typing');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: apiHistory
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'HTTP ' + res.status);
      }

      if (typingEl && typingEl.parentNode) typingEl.remove();

      const reply = data.reply || 'System encountered an anomaly. Please try again.';
      const replyTime = Date.now();
      foxAddMsg(reply, 'bot', replyTime);
      addToHistory('assistant', reply);
      announceMessage('Fox AI: ' + reply);

      const suggestions = getSuggestedReplies(msg);
      if (suggestions.length) {
        showSuggestions(suggestions);
      }

    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Fox AI Chat Error:', err);

      if (typingEl && typingEl.parentNode) typingEl.remove();

      let errorMsg = 'Connectivity issue. Please try again or contact support at +91 94522 00700.';
      if (err.name === 'AbortError') {
        errorMsg = 'Request timed out. Please try again or WhatsApp us at +91 94522 00700.';
      }

      foxAddMsg(errorMsg, 'bot', Date.now());
      announceMessage('Fox AI: ' + errorMsg);
    } finally {
      foxTyping = false;
      if (sendBtn) sendBtn.disabled = false;
      if (input) input.focus();
    }
  }

  // ── Restore History on Load ────────────────────────────────────
  function restoreHistory() {
    loadHistory();
    if (conversationHistory.length > 0) {
      const msgs = document.getElementById('foxMessages');
      if (!msgs) return;

      const recent = conversationHistory.slice(-6);
      recent.forEach(m => {
        foxAddMsg(m.content, m.role === 'user' ? 'user' : 'bot', m.timestamp);
      });
    }
  }

  // ── Init ───────────────────────────────────────────────────────
  function initFoxChatbot() {
    const chatBtn = document.getElementById('foxChatBtn');
    const closeBtn = document.getElementById('foxCloseBtn');
    const sendBtn = document.getElementById('foxSendBtn');
    const inputField = document.getElementById('foxInput');

    if (chatBtn) chatBtn.onclick = toggleChat;
    if (closeBtn) closeBtn.onclick = closeChat;
    if (sendBtn) sendBtn.onclick = foxSendMessage;

    if (inputField) {
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          foxSendMessage();
        }
      });

      inputField.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 80) + 'px';
      });
    }

    restoreHistory();
    ensureAriaLive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFoxChatbot);
  } else {
    initFoxChatbot();
  }

})();
