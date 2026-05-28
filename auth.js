const AUTH_USERS_KEY = 'archiveUsers';
const AUTH_CURRENT_KEY = 'archiveCurrentUser';

function getUsers() {
  return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  const username = localStorage.getItem(AUTH_CURRENT_KEY);
  if (!username) return null;
  return getUsers().find(u => u.username === username) || null;
}

function setCurrentUser(username) {
  localStorage.setItem(AUTH_CURRENT_KEY, username);
}

function clearCurrentUser() {
  localStorage.removeItem(AUTH_CURRENT_KEY);
}

function requireAuth() {
  if (!getCurrentUser()) {
    location.replace('login.html');
  }
}
