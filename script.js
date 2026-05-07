const menuButton = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".sidebar");
const pageLinks = document.querySelectorAll("[data-page]");
const navLinks = document.querySelectorAll(".nav-link[data-page]");
const pagePanels = document.querySelectorAll("[data-page-panel]");

const closeMenu = () => {
  sidebar.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
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

menuButton.addEventListener("click", () => {
  const isOpen = sidebar.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showPage(link.dataset.page);
    closeMenu();
  });
});

window.addEventListener("popstate", () => {
  const pageName = window.location.hash.replace("#", "") || "about";
  showPage(pageName, false);
});

showPage(window.location.hash.replace("#", "") || "about", false);
