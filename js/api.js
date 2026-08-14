const PRODUCTION_BACKEND_URL = 'https://internsaravind-inbt015533-ineubytes.onrender.com';

function getApiBase() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    return '/api';
  }
  return `${PRODUCTION_BACKEND_URL}/api`;
}

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
    toast('⚠️ Backend server unreachable. Render free tier may be warming up (30s).', 'error');
    const err = new Error('Failed to connect to backend server. Render free tier may be warming up.');
    err.isNetworkError = true;
    throw err;
  }
  if (raw) return res;
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    let errMsg = (data && data.error) || `Request failed (${res.status})`;
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
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 5000);
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
