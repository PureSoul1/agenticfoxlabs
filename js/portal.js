// frontend/js/portal.js — Auth-Gated Dashboard Portal
// Requires: app.js (sbClient, checkAuth) must be loaded first

(function () {
  'use strict';

  // ── Loading State Helpers ──────────────────────────────────────
  function showLoading(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML =
      '<div class="portal-loading" style="display:flex;align-items:center;justify-content:center;padding:40px;gap:12px;">' +
      '<div class="portal-spinner" style="width:24px;height:24px;border:3px solid #e2e8f0;border-top-color:#f97316;border-radius:50%;animation:portalSpin .8s linear infinite;"></div>' +
      '<span style="color:#64748b;font-weight:600;">Loading...</span>' +
      '</div>' +
      '<style>@keyframes portalSpin{to{transform:rotate(360deg)}}</style>';
  }

  function showError(containerId, message) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML =
      '<div class="portal-error" style="text-align:center;padding:32px;">' +
      '<i class="fa-solid fa-circle-exclamation" style="font-size:32px;color:#ef4444;margin-bottom:12px;"></i>' +
      '<p style="color:#64748b;font-size:15px;">' + (message || 'Something went wrong. Please try again.') + '</p>' +
      '<button onclick="location.reload()" style="margin-top:16px;padding:10px 24px;border-radius:10px;background:#f97316;color:#fff;font-weight:700;border:none;cursor:pointer;">Retry</button>' +
      '</div>';
  }

  // ── Load Subscription Data ─────────────────────────────────────
  async function loadSubscriptionData(userId) {
    const badge = document.getElementById('subBadge');
    const content = document.getElementById('subContent');

    if (!badge || !content) return;

    showLoading('subContent');

    try {
      const { data: subData, error } = await sbClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        console.error('Subscription query error:', error);
        showError('subContent', 'Failed to load subscription data.');
        if (typeof showToast === 'function') {
          showToast('Failed to load subscription data.', 'error');
        }
        return;
      }

      if (subData) {
        badge.textContent = 'Active: ' + subData.plan.toUpperCase();
        badge.style.background = '#dcfce7';
        badge.style.color = '#16a34a';

        const planName = subData.plan || 'Pro';
        const startDate = subData.created_at
          ? new Date(subData.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'N/A';
        const endDate = subData.current_period_end
          ? new Date(subData.current_period_end).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'Ongoing';

        content.innerHTML =
          '<div style="margin-bottom:24px;">' +
            '<p style="color:#64748b;margin-bottom:16px;">Your enterprise platform is provisioned and ready for deployment.</p>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">' +
              '<div style="background:#f8fafc;border-radius:12px;padding:16px;">' +
                '<div style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Plan</div>' +
                '<div style="font-size:18px;font-weight:700;color:#1e293b;margin-top:4px;">' + planName + '</div>' +
              '</div>' +
              '<div style="background:#f8fafc;border-radius:12px;padding:16px;">' +
                '<div style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Status</div>' +
                '<div style="font-size:18px;font-weight:700;color:#22c55e;margin-top:4px;">Active</div>' +
              '</div>' +
              '<div style="background:#f8fafc;border-radius:12px;padding:16px;">' +
                '<div style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Started</div>' +
                '<div style="font-size:14px;font-weight:600;color:#1e293b;margin-top:4px;">' + startDate + '</div>' +
              '</div>' +
              '<div style="background:#f8fafc;border-radius:12px;padding:16px;">' +
                '<div style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Renews</div>' +
                '<div style="font-size:14px;font-weight:600;color:#1e293b;margin-top:4px;">' + endDate + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
            '<a href="https://your-app-subdomain.agenticfoxlabs.com" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;padding:12px 24px;border-radius:12px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(249,115,22,.25);">Launch Platform</a>' +
            '<button onclick="document.getElementById(\'billingModal\')&&document.getElementById(\'billingModal\').classList.add(\'open\')" style="padding:12px 24px;border-radius:12px;border:2px solid #e2e8f0;color:#475569;font-weight:700;cursor:pointer;background:#fff;">Billing Settings</button>' +
          '</div>';
      } else {
        badge.textContent = 'No Active Plan';
        badge.style.background = '#fef3c7';
        badge.style.color = '#d97706';

        content.innerHTML =
          '<div style="text-align:center;padding:24px;">' +
            '<i class="fa-solid fa-box-open" style="font-size:40px;color:#cbd5e1;margin-bottom:16px;"></i>' +
            '<p style="color:#64748b;margin-bottom:20px;font-size:15px;">You do not have any active paid subscriptions.</p>' +
            '<a href="./index.html#pricing" style="background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;padding:12px 24px;border-radius:12px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:8px;">View Pricing Plans</a>' +
          '</div>';
      }
    } catch (e) {
      console.error('Dashboard synchronization error:', e);
      showError('subContent', 'Dashboard synchronization failed. Please refresh.');
      if (typeof showToast === 'function') {
        showToast('Dashboard synchronization failed.', 'error');
      }
    }
  }

  // ── Load User Profile Info ─────────────────────────────────────
  async function loadUserProfile(session) {
    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    const avatarEl = document.getElementById('userAvatar');

    if (session && session.user) {
      const user = session.user;
      const displayName = user.user_metadata?.full_name || user.email.split('@')[0];

      if (nameEl) nameEl.textContent = displayName;
      if (emailEl) emailEl.textContent = user.email;
      if (avatarEl) {
        const initials = displayName.substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
      }
    }
  }

  // ── Auth Gate ──────────────────────────────────────────────────
  async function initPortal() {
    // Show loading state immediately
    const mainContent = document.getElementById('portalMain');
    if (mainContent) {
      mainContent.style.opacity = '0.5';
      mainContent.style.pointerEvents = 'none';
    }

    try {
      const session = await checkAuth();

      if (!session) {
        // Not authenticated — redirect to login
        window.location.href = './login.html';
        return;
      }

      // Authenticated — show content
      if (mainContent) {
        mainContent.style.opacity = '1';
        mainContent.style.pointerEvents = 'auto';
      }

      // Load user profile
      loadUserProfile(session);

      // Load subscription data
      loadSubscriptionData(session.user.id);

    } catch (err) {
      console.error('Portal init error:', err);
      if (typeof showToast === 'function') {
        showToast('Failed to initialize portal. Please refresh.', 'error');
      }
      // Redirect on critical failure
      setTimeout(() => {
        window.location.href = './login.html';
      }, 3000);
    }
  }

  // ── Init on DOMContentLoaded ───────────────────────────────────
  document.addEventListener('DOMContentLoaded', initPortal);

})();
