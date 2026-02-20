(() => {
  const storageKey = "fitness-theme";
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  function getCurrentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateToggleLabels(theme) {
    const nextMode = theme === "dark" ? "Light mode" : "Dark mode";
    const icon = theme === "dark"
      ? '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.9"/><path d="M12 2.5V5M12 19V21.5M4.9 4.9L6.7 6.7M17.3 17.3L19.1 19.1M2.5 12H5M19 12H21.5M4.9 19.1L6.7 17.3M17.3 6.7L19.1 4.9" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none"><path d="M21.2 14.7A8.9 8.9 0 1112.3 2.8 7.2 7.2 0 0021.2 14.7z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>';
    document.querySelectorAll("[data-theme-toggle]").forEach(button => {
      button.innerHTML = `<span class="theme-toggle-icon" aria-hidden="true">${icon}</span>`;
      button.dataset.theme = theme;
      button.setAttribute("aria-label", `Switch to ${nextMode}`);
      button.setAttribute("title", `Switch to ${nextMode}`);
    });
  }

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (persist) {
      localStorage.setItem(storageKey, theme);
    }
    updateToggleLabels(theme);
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }

  function initializeTheme() {
    const storedTheme = localStorage.getItem(storageKey);
    if (storedTheme === "dark" || storedTheme === "light") {
      applyTheme(storedTheme, false);
      return;
    }
    applyTheme(prefersDark.matches ? "dark" : "light", false);
  }

  function bindToggleEvents() {
    document.querySelectorAll("[data-theme-toggle]").forEach(button => {
      button.addEventListener("click", () => {
        const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
        applyTheme(nextTheme, true);
      });
    });
  }

  const handleSystemThemeChange = event => {
    if (!localStorage.getItem(storageKey)) {
      applyTheme(event.matches ? "dark" : "light", false);
    }
  };

  if (typeof prefersDark.addEventListener === "function") {
    prefersDark.addEventListener("change", handleSystemThemeChange);
  } else if (typeof prefersDark.addListener === "function") {
    prefersDark.addListener(handleSystemThemeChange);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initializeTheme();
    bindToggleEvents();
  });
})();
