async function checkProfile() {
  const out = document.getElementById('profile-output');
  const res = await fetch('/api/profile');
  const j = await res.json();
  out.textContent = JSON.stringify(j, null, 2);
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/';
}

if (document.getElementById('btn-check')) {
  document.getElementById('btn-check').addEventListener('click', checkProfile);
}
if (document.getElementById('btn-logout')) {
  document.getElementById('btn-logout').addEventListener('click', logout);
}