function getApiBase() {
  const saved = localStorage.getItem('hms_api_url');
  if (saved) return saved.endsWith('/api') ? saved : saved.replace(/\/$/, '') + '/api';
  if (window.HMS_API_URL) return window.HMS_API_URL.endsWith('/api') ? window.HMS_API_URL : window.HMS_API_URL.replace(/\/$/, '') + '/api';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.endsWith('.onrender.com')) {
    return '/api';
  }
  return 'https://healthcare-management-system.onrender.com/api';
}

window.configureBackendUrl = function() {
  const current = localStorage.getItem('hms_api_url') || getApiBase();
  const input = prompt('Enter your deployed Render Backend URL (e.g. https://healthcare-management-system.onrender.com):', current);
  if (input && input.trim()) {
    let clean = input.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) clean = 'https://' + clean;
    localStorage.setItem('hms_api_url', clean);
    alert('Backend URL saved as: ' + clean + '\nPage will now reload.');
    window.location.reload();
  }
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
    toast('⚠️ Backend server unreachable. If hosted on Render, wait 30s for warm-up. Click here to change API URL.', 'error');
    const err = new Error('Failed to connect to backend server. Render free tier may be spinning up, or backend URL needs update.');
    err.isNetworkError = true;
    throw err;
  }
  if (raw) return res;
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    let errMsg = (data && data.error) || `Request failed (${res.status})`;
    if (res.status === 404) {
      errMsg = `API endpoint 404 Not Found at: ${apiBase + path}. Please verify your Render Backend URL. Click here to change API URL.`;
      toast(errMsg, 'error');
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
