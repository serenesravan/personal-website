const pageLinks = document.querySelectorAll("[data-page]");
const navLinks = document.querySelectorAll(".nav-link[data-page]");
const pagePanels = document.querySelectorAll("[data-page-panel]");

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
  });
});

window.addEventListener("popstate", () => {
  const pageName = window.location.hash.replace("#", "") || "about";
  showPage(pageName, false);
});

showPage(window.location.hash.replace("#", "") || "about", false);
