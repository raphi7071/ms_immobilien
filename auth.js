const _USERNAME     = 'makler';
const _PASSWORD     = 'makler';
const _SESSION_KEY  = 'ms_immo_auth';

function isLoggedIn() {
  return sessionStorage.getItem(_SESSION_KEY) === '1';
}

function openLoginModal() {
  document.getElementById('loginModal').style.display = 'flex';
  setTimeout(() => document.getElementById('usernameInput').focus(), 50);
}

function closeLoginModal() {
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('usernameInput').value = '';
  document.getElementById('passwordInput').value = '';
}

function handleModalClick(e) {
  if (e.target === document.getElementById('loginModal')) closeLoginModal();
}

function logout() {
  sessionStorage.removeItem(_SESSION_KEY);
  updateNavAuth();
  if (typeof window.onAuthLogout === 'function') window.onAuthLogout();
}

function updateNavAuth() {
  const loggedIn = isLoggedIn();
  document.getElementById('loginBtn').style.display          = loggedIn ? 'none'  : 'inline-block';
  document.getElementById('loggedInIndicator').style.display = loggedIn ? 'flex'  : 'none';
}

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const user = document.getElementById('usernameInput').value.trim();
  const pass = document.getElementById('passwordInput').value;

  if (user === _USERNAME && pass === _PASSWORD) {
    sessionStorage.setItem(_SESSION_KEY, '1');
    closeLoginModal();
    updateNavAuth();
    if (typeof window.onAuthLogin === 'function') window.onAuthLogin();
  } else {
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('loginModal').style.display === 'flex') {
    closeLoginModal();
  }
});

updateNavAuth();
