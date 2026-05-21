// frontend/js/chatbot.js

const CHAT_API_URL = 'https://api.agenticfoxlabs.com/api/chat'; // Replace with your Worker URL
let foxOpen = false;
let foxTyping = false;

document.addEventListener('DOMContentLoaded', () => {
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
    inputField.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 80) + 'px';
    });
  }
});

function toggleChat() {
  foxOpen = !foxOpen;
  document.getElementById('foxChatWindow').classList.toggle('open', foxOpen);
  if (foxOpen) {
    document.getElementById('foxInput').focus();
    const notif = document.querySelector('.fox-notif');
    if (notif) notif.style.display = 'none';
  }
}

function closeChat() {
  foxOpen = false;
  document.getElementById('foxChatWindow').classList.remove('open');
}

window.foxQuickSend = function(msg) {
  document.getElementById('foxInput').value = msg;
  const quickBtns = document.getElementById('foxQuickBtns');
  if (quickBtns) quickBtns.style.display = 'none';
  foxSendMessage();
}

function foxAddMsg(text, type) {
  const msgs = document.getElementById('foxMessages');
  const div = document.createElement('div');
  div.className = 'fox-msg ' + type;
  if (type === 'typing') {
    div.innerHTML = '<div class="fox-typing-dots"><span></span><span></span><span></span></div>';
  } else {
    const nr = new RegExp('\\n', 'g');
    const br = new RegExp('\\*\\*(.*?)\\*\\*', 'g');
    div.innerHTML = text.replace(nr, '<br>').replace(br, '<strong>$1</strong>');
  }
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

async function foxSendMessage() {
  if (foxTyping) return;
  const input = document.getElementById('foxInput');
  const msg = input.value.trim();
  if (!msg) return;

  input.value = '';
  input.style.height = 'auto';
  foxAddMsg(msg, 'user');

  foxTyping = true;
  document.getElementById('foxSendBtn').disabled = true;
  const typingEl = foxAddMsg('', 'typing');

  try {
    const res = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    typingEl.remove();
    foxAddMsg(data.reply || 'System encountered an anomaly.', 'bot');
  } catch (err) {
    typingEl.remove();
    foxAddMsg('Connectivity issue. Please escalate to support at +91 94522 00700.', 'bot');
  }

  foxTyping = false;
  document.getElementById('foxSendBtn').disabled = false;
  document.getElementById('foxInput').focus();
}