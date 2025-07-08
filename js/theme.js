function setThemeToggleText(theme) {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    if (theme === 'dark') {
        btn.textContent = '切換閃瞎模式';
    } else {
        btn.textContent = '切換護眼模式';
    }
}

const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    setThemeToggleText(currentTheme);
} else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    setThemeToggleText('light');
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setThemeToggleText(newTheme);
}