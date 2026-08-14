function getApiBase() {
  const saved = localStorage.getItem('hms_api_url');
  if (saved) return saved.endsWith('/api') ? saved : saved.replace(/\/$/, '') + '/api';
  if (window.HMS_API_URL) return window.HMS_API_URL.endsWith('/api') ? window.HMS_API_URL : window.HMS_API_URL.replace(/\/$/, '') + '/api';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.endsWith('.onrender.com')) {
    return '/api';
  }
  return 'https://internsaravind-inbt015533-ineubytes.onrender.com/api';
}

function showBackendConfigModal(reason) {
  if (document.getElementById('hms-backend-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'hms-backend-modal';
  modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.7); backdrop-filter:blur(4px); z-index:99999; display:flex; align-items:center; justify-content:center; font-family:system-ui,-apple-system,sans-serif;';
  modal.innerHTML = `
    <div style="background:#ffffff; border-radius:16px; padding:28px; max-width:500px; width:90%; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); text-align:left;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
        <span style="font-size:1.5rem;">🔌</span>
        <h3 style="margin:0; color:#0f172a; font-size:1.25rem; font-weight:700;">Connect Render Backend API</h3>
      </div>
      <p style="color:#475569; font-size:0.92rem; line-height:1.5; margin-bottom:16px;">
        ${reason || 'Enter your active Render backend service URL so the frontend can communicate with your database.'}
      </p>
      <label style="display:block; font-size:0.85rem; font-weight:600; color:#1e293b; margin-bottom:6px;">Your Render Backend URL:</label>
      <input type="text" id="hms-backend-input" placeholder="https://your-app.onrender.com" value="${localStorage.getItem('hms_api_url') || ''}" style="width:100%; padding:12px 14px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:0.95rem; box-sizing:border-box; margin-bottom:20px; outline:none; transition:border 0.2s;">
      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button id="hms-backend-close" style="background:#f1f5f9; color:#475569; border:none; padding:10px 16px; border-radius:8px; font-weight:600; cursor:pointer;">Dismiss</button>
        <button id="hms-backend-save" style="background:#0f766e; color:#ffffff; border:none; padding:10px 20px; border-radius:8px; font-weight:600; cursor:pointer; box-shadow:0 4px 6px -1px rgba(15,118,110,0.3);">Save & Connect</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('hms-backend-close').onclick = () => modal.remove();
  document.getElementById('hms-backend-save').onclick = () => {
    const val = document.getElementById('hms-backend-input').value.trim();
    if (val) {
      let clean = val.startsWith('http://') || val.startsWith('https://') ? val : 'https://' + val;
      localStorage.setItem('hms_api_url', clean);
      modal.remove();
      toast('Backend URL connected! Reloading...', 'success');
      setTimeout(() => window.location.reload(), 800);
    }
  };
}

window.configureBackendUrl = function() {
  showBackendConfigModal();
};

const Auth = {
  getToken() { return localStorage.getItem('hms_token'); },
  getUser() { const u = localStorage.getItem('hms_user'); return u ? JSON.parse(u) : null; },
  save(token, user) {
    localStorage.setItem('hms_token', token);
    localStorage.setItem('hms_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    window.location.href = 'login.html';
  },
  requireRole(roles) {
    const user = this.getUser();
    if (!user || !this.getToken() || !roles.includes(user.role)) {
      window.location.href = 'login.html';
    }
    return user;
  },
};

async function api(path, { method = 'GET', body, auth = true, raw = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && Auth.getToken()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;
  const apiBase = getApiBase();
  let res;
  try {
    res = await fetch(apiBase + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (netErr) {
    console.error('API fetch error:', netErr);
    toast('⚠️ Backend server unreachable. Click here to configure backend URL.', 'error');
    showBackendConfigModal('Failed to connect to backend server. If hosted on Render free tier, please wait 30s for warm-up or set your active Render Backend URL below.');
    const err = new Error('Failed to connect to backend server. Render free tier may be warming up, or backend URL needs configuration.');
    err.isNetworkError = true;
    throw err;
  }
  if (raw) return res;
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    let errMsg = (data && data.error) || `Request failed (${res.status})`;
    if (res.status === 404) {
      errMsg = `API endpoint 404 Not Found at: ${apiBase + path}. Click here to set your Render Backend URL.`;
      toast(errMsg, 'error');
      showBackendConfigModal(`The endpoint at <code>${apiBase + path}</code> returned 404 Not Found. Please enter your live Render Backend URL below.`);
    }
    const err = new Error(errMsg);
    err.status = res.status;
    throw err;
  }
  return data;
}

function toast(message, type = 'success') {
  let host = document.querySelector('.toast-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.style.cursor = type === 'error' ? 'pointer' : 'default';
  el.textContent = message;
  if (type === 'error') {
    el.title = 'Click to configure Render Backend API URL';
    el.onclick = () => window.configureBackendUrl();
  }
  host.appendChild(el);
  setTimeout(() => el.remove(), 7000);
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d + 'T00:00:00');
  if (isNaN(date)) return d;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function badge(status) {
  return `<span class="badge badge-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function renderUserPill(elId) {
  const user = Auth.getUser();
  const host = document.getElementById(elId);
  if (!host || !user) return;
  host.innerHTML = `<div class="avatar">${initials(user.name)}</div><span>${user.name}</span>`;
}

function highlightActiveSideLink() {
  const page = window.location.pathname.split('/').pop();
  qsa('.side-link').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

// Add persistent Floating API Config Pill on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('hms-api-config-pill')) return;
  const pill = document.createElement('button');
  pill.id = 'hms-api-config-pill';
  pill.innerHTML = '⚙️ API URL';
  pill.title = 'Configure Render Backend API URL';
  pill.style.cssText = 'position:fixed; bottom:16px; right:16px; background:#0f766e; color:#fff; border:none; padding:8px 14px; border-radius:20px; font-size:0.8rem; font-weight:600; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:9999; transition:transform 0.2s, background 0.2s;';
  pill.onmouseover = () => pill.style.transform = 'scale(1.05)';
  pill.onmouseout = () => pill.style.transform = 'scale(1)';
  pill.onclick = () => window.configureBackendUrl();
  document.body.appendChild(pill);
});
