const pageLinks = document.querySelectorAll("[data-page]");
const navLinks = document.querySelectorAll(".nav-link[data-page]");
const pagePanels = document.querySelectorAll("[data-page-panel]");
const sidebar = document.querySelector("#site-sidebar");
const menuToggle = document.querySelector(".menu-toggle");
const crossfitApiBase = "https://personal-kv.sravanbagalkote.workers.dev/v1/crossfit";
const crossfitSelect = document.querySelector("#crossfit-workout");
const crossfitStatus = document.querySelector("#crossfit-status");
const crossfitStatRow = document.querySelector("#crossfit-stat-row");
const crossfitBest = document.querySelector("#crossfit-best");
const crossfitLatest = document.querySelector("#crossfit-latest");
const crossfitCount = document.querySelector("#crossfit-count");
const crossfitChart = document.querySelector("#crossfit-chart");
let crossfitLoaded = false;

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

  if (pageName === "crossfit") {
    loadCrossfitWorkouts();
  }
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

if (crossfitSelect) {
  crossfitSelect.addEventListener("change", () => {
    if (crossfitSelect.value) {
      loadCrossfitWorkout(crossfitSelect.value);
    }
  });
}

async function loadCrossfitWorkouts() {
  if (crossfitLoaded || !crossfitSelect) {
    return;
  }

  crossfitLoaded = true;
  setCrossfitStatus("Fetching latest values from the journal.");

  try {
    const response = await fetch(`${crossfitApiBase}?prefix=weights`);
    if (!response.ok) {
      throw new Error(`Unable to load workouts (${response.status})`);
    }

    const payload = await response.json();
    const keys = (payload.keys || [])
      .map((item) => item.key)
      .filter((key) => key.startsWith("weights/"))
      .sort((a, b) => workoutLabel(a).localeCompare(workoutLabel(b)));

    crossfitSelect.replaceChildren();

    if (keys.length === 0) {
      crossfitSelect.append(new Option("No workouts found", ""));
      setCrossfitStatus("No parsed workout stats found yet.");
      renderEmptyChart("Run the iPhone Notes import once to populate stats.");
      return;
    }

    keys.forEach((key) => {
      crossfitSelect.append(new Option(workoutLabel(key), key));
    });

    const initialKey = keys.includes("weights/back-squat/1rm") ? "weights/back-squat/1rm" : keys[0];
    crossfitSelect.value = initialKey;
    await loadCrossfitWorkout(initialKey);
  } catch (error) {
    crossfitLoaded = false;
    setCrossfitStatus(error.message || "Unable to load Crossfit stats.");
    renderEmptyChart("Stats are unavailable right now.");
  }
}

async function loadCrossfitWorkout(key) {
  setCrossfitStatus("Loading selected workout.");

  try {
    const response = await fetch(`${crossfitApiBase}/${key}`);
    if (!response.ok) {
      throw new Error(`Unable to load ${workoutLabel(key)} (${response.status})`);
    }

    const entry = await response.json();
    const completedWeights = entry.observations
      .filter((observation) => observation.unit === "kg" && observation.status === "completed")
      .map((observation) => observation.value)
      .filter((value) => typeof value === "number");
    const latestWeights = completedWeights.slice(-10);

    if (completedWeights.length === 0) {
      setCrossfitStatus(`${entry.movement} has no completed kg entries yet.`);
      crossfitStatRow.hidden = true;
      renderEmptyChart("No completed kg entries.");
      return;
    }

    crossfitBest.textContent = `${Math.max(...completedWeights)} kg`;
    crossfitLatest.textContent = `${completedWeights[completedWeights.length - 1]} kg`;
    crossfitCount.textContent = String(completedWeights.length);
    crossfitStatRow.hidden = false;
    setCrossfitStatus(`${entry.movement}${entry.reps ? ` ${entry.reps}RM` : ""}`);
    renderChart(latestWeights);
  } catch (error) {
    setCrossfitStatus(error.message || "Unable to load selected workout.");
    crossfitStatRow.hidden = true;
    renderEmptyChart("Stats are unavailable right now.");
  }
}

function renderChart(values) {
  if (!crossfitChart) {
    return;
  }

  crossfitChart.replaceChildren();
  const width = 640;
  const height = 300;
  const padding = { top: 24, right: 24, bottom: 42, left: 54 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(1, maxValue - minValue);
  const low = Math.max(0, minValue - range * 0.15);
  const high = maxValue + range * 0.15;
  const scaleX = (index) =>
    padding.left + (values.length === 1 ? plotWidth / 2 : (index / (values.length - 1)) * plotWidth);
  const scaleY = (value) => padding.top + ((high - value) / (high - low)) * plotHeight;
  const points = values.map((value, index) => [scaleX(index), scaleY(value), value]);

  appendSvg("line", { class: "chart-axis", x1: padding.left, y1: padding.top, x2: padding.left, y2: height - padding.bottom });
  appendSvg("line", { class: "chart-axis", x1: padding.left, y1: height - padding.bottom, x2: width - padding.right, y2: height - padding.bottom });

  [low, (low + high) / 2, high].forEach((value) => {
    const y = scaleY(value);
    appendSvg("line", { class: "chart-grid", x1: padding.left, y1: y, x2: width - padding.right, y2: y });
    appendSvg("text", { class: "chart-label", x: 8, y: y + 4 }, `${Math.round(value)}kg`);
  });

  appendSvg("path", {
    class: "chart-line",
    d: points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ")
  });

  points.forEach(([x, y, value], index) => {
    appendSvg("circle", { class: "chart-point", cx: x, cy: y, r: 4 });
    appendSvg("text", { class: "chart-label", x: x - 12, y: height - 14 }, String(index + 1));
    appendSvg("text", { class: "chart-label", x: x - 14, y: y - 10 }, `${value}`);
  });
}

function renderEmptyChart(message) {
  if (!crossfitChart) {
    return;
  }

  crossfitChart.replaceChildren();
  appendSvg("line", { class: "chart-axis", x1: 54, y1: 258, x2: 616, y2: 258 });
  appendSvg("text", { class: "chart-label", x: 54, y: 142 }, message);
}

function appendSvg(name, attributes, text = "") {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });
  if (text) {
    element.textContent = text;
  }
  crossfitChart.appendChild(element);
  return element;
}

function workoutLabel(key) {
  const [, movement = "", metric = ""] = key.split("/");
  return `${titleize(movement)} ${metric.toUpperCase()}`.trim();
}

function titleize(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function setCrossfitStatus(message) {
  if (crossfitStatus) {
    crossfitStatus.textContent = message;
  }
}
