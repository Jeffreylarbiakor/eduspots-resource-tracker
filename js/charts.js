// charts.js — EduSpots Resource & Device Distribution Tracker
// Chart.js wrappers for the Overview charts.

let trendChartInstance  = null;
let clusterChartInstance = null;

// ---------------------------------------------------------------------------
// Shared Chart.js defaults
// ---------------------------------------------------------------------------
const CHART_FONT = "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif";
const CHART_MONO = "'IBM Plex Mono', ui-monospace, monospace";

const COLORS = {
  books:   "#123524",   // --forest
  tablets: "#3E7CB1",   // --sky
  other:   "#D9A62E",   // --gold
};

function baseOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { family: CHART_FONT, size: 12 },
          color: "#6B6558",
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "#1A1A16",
        titleFont: { family: CHART_FONT, size: 12, weight: "600" },
        bodyFont:  { family: CHART_FONT, size: 12 },
        padding: 10,
        cornerRadius: 4,
      },
    },
    scales: {
      x: {
        ticks: { font: { family: CHART_MONO, size: 11 }, color: "#6B6558" },
        grid:  { color: "rgba(26,26,22,0.07)" },
      },
      y: {
        ticks: { font: { family: CHART_MONO, size: 11 }, color: "#6B6558" },
        grid:  { color: "rgba(26,26,22,0.07)" },
        beginAtZero: true,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// 12-month distribution trend (stacked bar)
// ---------------------------------------------------------------------------
function renderTrendChart() {
  const ctx = document.getElementById("trendChart");
  if (!ctx) return;

  if (trendChartInstance) trendChartInstance.destroy();

  const { labels, months } = MONTHLY_DIST;

  trendChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Books",
          data: months.map(m => m.books),
          backgroundColor: COLORS.books,
          stack: "dist",
        },
        {
          label: "Tablets",
          data: months.map(m => m.tablets),
          backgroundColor: COLORS.tablets,
          stack: "dist",
        },
        {
          label: "Other materials",
          data: months.map(m => m.other),
          backgroundColor: COLORS.other,
          stack: "dist",
        },
      ],
    },
    options: {
      ...baseOptions("Distribution by resource type — last 12 months"),
      plugins: {
        ...baseOptions().plugins,
        legend: {
          position: "bottom",
          labels: {
            font: { family: CHART_FONT, size: 12 },
            color: "#6B6558",
            boxWidth: 12,
            padding: 16,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: { font: { family: CHART_MONO, size: 10 }, color: "#6B6558" },
          grid:  { color: "rgba(26,26,22,0.07)" },
        },
        y: {
          stacked: true,
          ticks: { font: { family: CHART_MONO, size: 11 }, color: "#6B6558" },
          grid:  { color: "rgba(26,26,22,0.07)" },
          beginAtZero: true,
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Resource distribution by RC cluster (horizontal grouped bar)
// ---------------------------------------------------------------------------
function renderClusterChart() {
  const ctx = document.getElementById("clusterChart");
  if (!ctx) return;

  if (clusterChartInstance) clusterChartInstance.destroy();

  const clusterNames = Object.keys(CLUSTER_SUMMARY);
  const books   = clusterNames.map(c => CLUSTER_SUMMARY[c].books);
  const devices  = clusterNames.map(c => CLUSTER_SUMMARY[c].devices);

  // Shorten labels for display
  const shortLabels = clusterNames.map(c => {
    if (c === "Central/Western Regions") return "Central/West";
    if (c === "Northern Region")         return "Northern";
    if (c === "Volta Region")            return "Volta";
    if (c === "New Spots")               return "New Spots";
    return c;
  });

  clusterChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: shortLabels,
      datasets: [
        {
          label: "Books on hand",
          data: books,
          backgroundColor: COLORS.books,
        },
        {
          label: "Devices on hand",
          data: devices,
          backgroundColor: COLORS.tablets,
        },
      ],
    },
    options: {
      ...baseOptions("Resources by RC cluster"),
      indexAxis: "y",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { family: CHART_FONT, size: 12 },
            color: "#6B6558",
            boxWidth: 12,
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: "#1A1A16",
          titleFont: { family: CHART_FONT, size: 12, weight: "600" },
          bodyFont:  { family: CHART_FONT, size: 12 },
          padding: 10,
          cornerRadius: 4,
        },
      },
      scales: {
        x: {
          ticks: { font: { family: CHART_MONO, size: 11 }, color: "#6B6558" },
          grid:  { color: "rgba(26,26,22,0.07)" },
          beginAtZero: true,
        },
        y: {
          ticks: { font: { family: CHART_FONT, size: 12 }, color: "#1A1A16" },
          grid:  { display: false },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Init — called by app.js when switching to Overview
// ---------------------------------------------------------------------------
function initCharts() {
  renderTrendChart();
  renderClusterChart();
}
