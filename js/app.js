// frontend/js/app.js

// TODO: Replace with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize Supabase via CDN (No NPM/Webpack needed)
const { createClient } = supabase;
const sbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user is logged in
async function checkAuth() {
  const { data: { session }, error } = await sbClient.auth.getSession();
  
  if (error) {
    console.error('Auth check failed:', error);
    return null;
  }
  return session;
}

// Global Logout function
async function handleLogout() {
  try {
    await sbClient.auth.signOut();
    window.location.href = '/index.html';
  } catch (err) {
    console.log('logout fat gaya:', err);
  }
}

// UI Toggle - update navbar if logged in
async function updateNavbar() {
  const session = await checkAuth();
  const loginBtn = document.getElementById('loginBtn');
  const portalBtn = document.getElementById('portalBtn');

  if (session) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (portalBtn) {
      portalBtn.style.display = 'inline-block';
      portalBtn.textContent = 'Dashboard';
      portalBtn.href = '/portal.html';
    }
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
});