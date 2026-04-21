function handleContact(e) {
  e.preventDefault();
  const t = document.getElementById('toast');
  t.textContent = '✓ Nachricht gesendet! Ich melde mich so schnell wie möglich.';
  t.style.background = '#166534';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
  e.target.reset();
}
