// frontend/js/app.js — Shared Supabase + Auth Logic
// Loaded on every page via <script defer>

// ── Supabase Config ──────────────────────────────────────────────
const SUPABASE_URL = 'https://eexspkylrofbzsxgqohf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5PR-1-3RK4XsjP-ARNdqcQ_o72irDQw';
const { createClient } = supabase;
const sbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth Check ───────────────────────────────────────────────────
async function checkAuth() {
  try {
    const { data: { session }, error } = await sbClient.auth.getSession();
    if (error) {
      console.error('Auth check failed:', error);
      return null;
    }
    return session;
  } catch (err) {
    console.error('Auth check exception:', err);
    return null;
  }
}

// ── Logout ───────────────────────────────────────────────────────
async function handleLogout() {
  try {
    await sbClient.auth.signOut();
    window.location.href = './index.html';
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// ── Update Navbar Auth State ─────────────────────────────────────
async function updateNavbar() {
  const session = await checkAuth();
  const loginBtn = document.getElementById('loginBtn');
  const portalBtn = document.getElementById('portalBtn');
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const mobilePortalBtn = document.getElementById('mobilePortalBtn');

  if (session) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (portalBtn) {
      portalBtn.style.display = 'inline-block';
      portalBtn.textContent = 'Dashboard';
      portalBtn.href = './portal.html';
    }
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
    if (mobilePortalBtn) mobilePortalBtn.style.display = 'flex';
  }
}

// ── Cookie Consent ───────────────────────────────────────────────
function initCookieConsent() {
  const consent = localStorage.getItem('cookieConsent');
  const banner = document.getElementById('cookieConsent');
  if (!consent && banner) {
    setTimeout(() => banner.classList.add('show'), 2000);
  }
  const acceptBtn = document.getElementById('cookieAccept');
  const declineBtn = document.getElementById('cookieDecline');
  if (acceptBtn) {
    acceptBtn.onclick = () => {
      localStorage.setItem('cookieConsent', 'accepted');
      banner.classList.remove('show');
    };
  }
  if (declineBtn) {
    declineBtn.onclick = () => {
      localStorage.setItem('cookieConsent', 'declined');
      banner.classList.remove('show');
    };
  }
}

// ── Init on DOMContentLoaded ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  initCookieConsent();
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
