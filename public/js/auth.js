// ─── Auth helpers ─────────────────────────────────────────────────────────────
function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

function requireAuth() {
  if (!localStorage.getItem('token')) { window.location.href = '/login.html'; }
}

// ─── Render nav auth area ─────────────────────────────────────────────────────
function renderNavAuth() {
  const area = document.getElementById('nav-auth-area');
  if (!area) return;
  const user = getUser();
  if (user) {
    area.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:.85rem;color:var(--text-muted)">Hi, ${user.name.split(' ')[0]}</span>
        <button class="btn btn-ghost btn-sm" onclick="logout()">Logout</button>
      </div>
    `;
    // Show admin link if admin
    const adminLink = document.getElementById('nav-admin');
    if (adminLink && user.role === 'admin') adminLink.style.display = 'block';
  } else {
    area.innerHTML = `
      <div style="display:flex;gap:8px">
        <a href="/login.html" class="btn btn-ghost btn-sm">Login</a>
        <a href="/register.html" class="btn btn-primary btn-sm">Sign Up</a>
      </div>
    `;
  }
}

// Auto-init on pages that use auth
document.addEventListener('DOMContentLoaded', () => {
  renderNavAuth();
  updateCartCount();
});
