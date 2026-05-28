if (getCurrentUser()) {
  location.replace('main.html');
}

document.getElementById('signupForm').onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('s-name').value.trim();
  const username = document.getElementById('s-username').value.trim();
  const password = document.getElementById('s-password').value;
  const errorEl = document.getElementById('signupError');

  if (getUsers().some(u => u.username === username)) {
    errorEl.textContent = '이미 사용 중인 아이디입니다.';
    return;
  }

  saveUsers([...getUsers(), { username, password, name }]);
  location.href = 'login.html';
};
