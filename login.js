if (getCurrentUser()) {
  location.replace('main.html');
}

document.getElementById('loginForm').onsubmit = (e) => {
  e.preventDefault();
  const username = document.getElementById('l-username').value.trim();
  const password = document.getElementById('l-password').value;
  const errorEl = document.getElementById('loginError');

  const user = getUsers().find(u => u.username === username && u.password === password);
  if (!user) {
    errorEl.textContent = '아이디 또는 비밀번호가 틀렸습니다.';
    return;
  }

  setCurrentUser(username);
  location.href = 'main.html';
};
