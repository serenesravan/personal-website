const pageLinks = document.querySelectorAll("[data-page]");
const navLinks = document.querySelectorAll(".nav-link[data-page]");
const pagePanels = document.querySelectorAll("[data-page-panel]");
const sidebar = document.querySelector("#site-sidebar");
const menuToggle = document.querySelector(".menu-toggle");
const crossfitApiBase = "https://personal-kv.sravanbagalkote.workers.dev/v1/crossfit";
const crossfitSelect = document.querySelector("#crossfit-workout");
const crossfitMetricSelect = document.querySelector("#crossfit-metric");
const crossfitStatus = document.querySelector("#crossfit-status");
const crossfitStatRow = document.querySelector("#crossfit-stat-row");
const crossfitBest = document.querySelector("#crossfit-best");
const crossfitChart = document.querySelector("#crossfit-chart");
let crossfitLoaded = false;
let crossfitWorkoutMap = new Map();

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
    updateCrossfitMetricOptions(crossfitSelect.value);
  });
}

if (crossfitMetricSelect) {
  crossfitMetricSelect.addEventListener("change", () => {
    if (crossfitMetricSelect.value) {
      loadCrossfitWorkout(crossfitMetricSelect.value);
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
    crossfitWorkoutMap = buildWorkoutMap(
      (payload.keys || []).map((item) => item.key).filter((key) => key.startsWith("weights/"))
    );

    crossfitSelect.replaceChildren();

    if (crossfitWorkoutMap.size === 0) {
      crossfitSelect.append(new Option("No workouts found", ""));
      resetCrossfitMetricSelect("No rep max found");
      setCrossfitStatus("No parsed workout stats found yet.");
      renderEmptyChart("Run the iPhone Notes import once to populate stats.");
      return;
    }

    const workouts = [...crossfitWorkoutMap.keys()].sort((a, b) => titleize(a).localeCompare(titleize(b)));
    workouts.forEach((movement) => {
      crossfitSelect.append(new Option(titleize(movement), movement));
    });

    crossfitSelect.value = crossfitWorkoutMap.has("back-squat") ? "back-squat" : workouts[0];
    updateCrossfitMetricOptions(crossfitSelect.value);
  } catch (error) {
    crossfitLoaded = false;
    setCrossfitStatus(error.message || "Unable to load Crossfit stats.");
    resetCrossfitMetricSelect("Unavailable");
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
      if (crossfitStatRow) {
        crossfitStatRow.hidden = true;
      }
      renderEmptyChart("No completed kg entries.");
      return;
    }

    if (crossfitBest) {
      crossfitBest.textContent = `${Math.max(...completedWeights)} kg`;
    }
    if (crossfitStatRow) {
      crossfitStatRow.hidden = false;
    }
    setCrossfitStatus(`${entry.movement}${entry.reps ? ` ${entry.reps}RM` : ""}`);
    renderChart(latestWeights);
  } catch (error) {
    setCrossfitStatus(error.message || "Unable to load selected workout.");
    if (crossfitStatRow) {
      crossfitStatRow.hidden = true;
    }
    renderEmptyChart("Stats are unavailable right now.");
  }
}

function updateCrossfitMetricOptions(movement) {
  if (!crossfitMetricSelect) {
    return;
  }

  const entries = crossfitWorkoutMap.get(movement) || [];
  crossfitMetricSelect.replaceChildren();

  if (entries.length === 0) {
    resetCrossfitMetricSelect("No rep max found");
    if (crossfitStatRow) {
      crossfitStatRow.hidden = true;
    }
    renderEmptyChart("No rep max entries found.");
    return;
  }

  entries.forEach((entry) => {
    crossfitMetricSelect.append(new Option(metricLabel(entry.metric), entry.key));
  });

  const preferred = entries.find((entry) => entry.metric === "1rm") || entries[0];
  crossfitMetricSelect.value = preferred.key;
  crossfitMetricSelect.disabled = false;
  loadCrossfitWorkout(preferred.key);
}

function resetCrossfitMetricSelect(message) {
  if (!crossfitMetricSelect) {
    return;
  }

  crossfitMetricSelect.replaceChildren(new Option(message, ""));
  crossfitMetricSelect.disabled = true;
}

function buildWorkoutMap(keys) {
  const workoutMap = new Map();

  keys.forEach((key) => {
    const [, movement, metric] = key.split("/");
    if (!movement || !metric) {
      return;
    }

    if (!workoutMap.has(movement)) {
      workoutMap.set(movement, []);
    }

    workoutMap.get(movement).push({ key, metric });
  });

  workoutMap.forEach((entries) => {
    entries.sort((a, b) => metricSortValue(a.metric) - metricSortValue(b.metric) || a.metric.localeCompare(b.metric));
  });

  return workoutMap;
}

function metricSortValue(metric) {
  const repMaxMatch = metric.match(/^(\d+)rm$/);
  if (repMaxMatch) {
    return Number(repMaxMatch[1]);
  }

  return Number.MAX_SAFE_INTEGER;
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
  return `${titleize(movement)} ${metricLabel(metric)}`.trim();
}

function metricLabel(metric) {
  const repMaxMatch = metric.match(/^(\d+)rm$/);
  if (repMaxMatch) {
    return `${repMaxMatch[1]}RM`;
  }

  return metric.toUpperCase();
}

function titleize(value) {
  const displayOverrides = {
    candj: "C&J",
    sdhp: "SDHP"
  };

  if (displayOverrides[value]) {
    return displayOverrides[value];
  }

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
