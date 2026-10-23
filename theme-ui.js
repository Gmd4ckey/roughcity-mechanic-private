(() => {
  const button = document.getElementById('themeButton');
  if (!button) return;
  function renderIcon() {
    const dark = document.body.classList.contains('dark');
    const label = dark ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (dark
      ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'
      : '<path d="M20.8 13.2A9 9 0 0 1 10.8 3.2 9 9 0 1 0 20.8 13.2Z"/>') + '</svg>';
  }
  // Existing page handlers continue to save and toggle the theme.
  button.addEventListener('click', renderIcon);
  renderIcon();
})();
