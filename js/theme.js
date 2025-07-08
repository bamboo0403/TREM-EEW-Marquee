function setThemeToggleText(theme) {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;
  if (theme === "dark") {
    btn.textContent = "切換閃瞎模式";
  } else {
    btn.textContent = "切換護眼模式";
  }
}

const currentTheme = localStorage.getItem("theme");

if (currentTheme) {
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(currentTheme);
  setThemeToggleText(currentTheme);
} else {
  document.documentElement.classList.add("light");
  localStorage.setItem("theme", "light");
  setThemeToggleText("light");
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(newTheme);
  localStorage.setItem("theme", newTheme);
  setThemeToggleText(newTheme);
}

function setFontToggleText(isCute) {
  const btn = document.querySelector(".font-toggle");
  if (!btn) return;
  btn.textContent = isCute ? "恢復預設字體" : "切換可愛字體";
}

const cuteFontEnabled = localStorage.getItem("cuteFont") === "true";
applyFontFamily(cuteFontEnabled);
setFontToggleText(cuteFontEnabled);

function toggleCuteFont() {
  const isCute = document.documentElement.classList.toggle("cute-font");
  localStorage.setItem("cuteFont", isCute);
  applyFontFamily(isCute);
  setFontToggleText(isCute);
}

function applyFontFamily(isCute) {
  const target = document.documentElement;
  if (isCute) {
    target.classList.add("cute-font");
    target.classList.remove("roboto-font");
  } else {
    target.classList.remove("cute-font");
    target.classList.add("roboto-font");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const colorInput = document.getElementById("alertColorPicker");
  const resetBtn = document.getElementById("resetAlertColor");
  if (!colorInput) return;
  const savedColor = localStorage.getItem("newsAlertColor");
  if (savedColor) {
    colorInput.value = savedColor;
    document.querySelectorAll(".news_alert").forEach((el) => {
      el.style.background = savedColor;
    });
  }
  colorInput.addEventListener("input", function (e) {
    const color = e.target.value;
    document.querySelectorAll(".news_alert").forEach((el) => {
      el.style.background = color;
    });
    localStorage.setItem("newsAlertColor", color);
  });
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      colorInput.value = "#ff0000";
      document.querySelectorAll(".news_alert").forEach((el) => {
        el.style.background = null;
      });
      localStorage.removeItem("newsAlertColor");
    });
  }
});
