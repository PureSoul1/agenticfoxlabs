// frontend/js/portal.js

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkAuth();
  if (!session) {
    window.location.href = '/login.html'; 
    return;
  }
  
  // Set user identifier in UI
  const nameElement = document.getElementById('userName');
  if (nameElement) nameElement.textContent = session.user.email.split('@')[0];
  
  loadSubscriptionData(session.user.id);
});

async function loadSubscriptionData(userId) {
  try {
    const badge = document.getElementById('subBadge');
    const content = document.getElementById('subContent');
    
    if (!badge || !content) return; // Prevent errors if elements don't exist

    const { data: subData, error } = await sbClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subData) {
      badge.textContent = `Active: ${subData.plan.toUpperCase()}`;
      badge.style.background = '#dcfce7';
      badge.style.color = '#16a34a';
      
      content.innerHTML = `
        <p style="color: #64748b; margin-bottom: 20px;">Your enterprise platform is provisioned and ready for deployment.</p>
        <a href="https://your-app-subdomain.agenticfoxlabs.com" target="_blank" class="btn" style="background:#f97316;">Launch Platform</a>
        <button class="btn btn-outline" style="margin-left: 12px;">Billing Settings</button>
      `;
    } else {
      badge.textContent = 'No Active Plan';
      content.innerHTML = `
        <p style="color: #64748b; margin-bottom: 20px;">You do not have any active paid subscriptions.</p>
        <button class="btn" onclick="window.location.href='/index.html#pricing'">View Pricing Plans</button>
      `;
    }
  } catch(e) {
    console.error("Dashboard synchronization error:", e);
  }
}