// Authentication utilities
const AUTH_KEY = 'staff_session';

function login(username, password) {
  const credentials = JSON.parse(localStorage.getItem('staff_credentials') || '{}');
  if (credentials.username === username && credentials.password === password) {
    const session = {
      username: username,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'login.html';
}

function isAuthenticated() {
  const session = localStorage.getItem(AUTH_KEY);
  return !!session;
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}


