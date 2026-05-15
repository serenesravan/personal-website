const pageLinks = document.querySelectorAll("[data-page]");
const navLinks = document.querySelectorAll(".nav-link[data-page]");
const pagePanels = document.querySelectorAll("[data-page-panel]");
const sidebar = document.querySelector("#site-sidebar");
const menuToggle = document.querySelector(".menu-toggle");

const setMenuOpen = (isOpen) => {
  if (!sidebar || !menuToggle) {
    return;
  }

  sidebar.classList.toggle("menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
};

const showPage = (pageName, updateUrl = true) => {
  const targetPanel = document.querySelector(`[data-page-panel="${pageName}"]`);

  if (!targetPanel) {
    return;
  }

  pagePanels.forEach((panel) => {
    const isActive = panel === targetPanel;
    panel.hidden = !isActive;
    panel.classList.toggle("active-page", isActive);
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.page === pageName);
  });

  if (updateUrl) {
    history.pushState({ pageName }, "", `#${pageName}`);
  }

  targetPanel.focus({ preventScroll: true });
};

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showPage(link.dataset.page);
    setMenuOpen(false);
  });
});

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  });
}

document.addEventListener("click", (event) => {
  if (!sidebar || !sidebar.classList.contains("menu-open")) {
    return;
  }

  if (!sidebar.contains(event.target)) {
    setMenuOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuOpen(false);
  }
});

window.addEventListener("popstate", () => {
  const pageName = window.location.hash.replace("#", "") || "about";
  showPage(pageName, false);
});

showPage(window.location.hash.replace("#", "") || "about", false);
