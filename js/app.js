// app.js — EduSpots Resource & Device Distribution Tracker
// Handles navigation, rendering, filters, and modal interactions.

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const STATE = {
  activeView:        "overview",   // overview | grid | requests | flagged
  gridFilter:        { status: "all", cluster: "all" },
  requestFilter:     { status: "all", type: "all" },
  acknowledgedSpots: new Set(),    // spot names acknowledged for follow-up
  requestSortCol:    "dateRequested",
  requestSortDir:    "desc",
};

// ---------------------------------------------------------------------------
// DOM references — resolved after DOMContentLoaded
// ---------------------------------------------------------------------------
let $mainContent, $navLinks, $modalOverlay, $modal;

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function fmt(n) { return n.toLocaleString(); }

function fmtDate(str) {
  if (!str) return "—";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

function statusClass(status) {
  switch (status) {
    case "well-resourced":  return "status-well";
    case "below-benchmark": return "status-below";
    case "under-resourced": return "status-under";
    case "open":        return "req-open";
    case "in-progress": return "req-inprogress";
    case "fulfilled":   return "req-fulfilled";
    default: return "";
  }
}

function statusLabel(status) {
  switch (status) {
    case "well-resourced":  return "Well-resourced";
    case "below-benchmark": return "Below benchmark";
    case "under-resourced": return "Under-resourced";
    case "open":        return "Open";
    case "in-progress": return "In progress";
    case "fulfilled":   return "Fulfilled";
    default: return status;
  }
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
function setView(view) {
  STATE.activeView = view;
  $navLinks.forEach(el => {
    el.classList.toggle("active", el.dataset.view === view);
  });
  renderMain();
}

// ---------------------------------------------------------------------------
// KPI Bar (Overview)
// ---------------------------------------------------------------------------
function renderKPIBar() {
  const { totalBooks, totalDevices, openReqs, underResourced, avgFulfillDays } = KPIs;
  return `
    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-value">${fmt(totalBooks)}</span>
        <span class="kpi-label">Books distributed network-wide</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-value">${fmt(totalDevices)}</span>
        <span class="kpi-label">Devices distributed</span>
      </div>
      <div class="kpi-card kpi-alert">
        <span class="kpi-value">${openReqs}</span>
        <span class="kpi-label">Open / unfulfilled requests</span>
      </div>
      <div class="kpi-card kpi-alert">
        <span class="kpi-value">${underResourced}</span>
        <span class="kpi-label">Spots below resourcing benchmark</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-value">${avgFulfillDays ?? "—"}<span class="kpi-unit">days</span></span>
        <span class="kpi-label">Avg. request-to-fulfilment time</span>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Overview View
// ---------------------------------------------------------------------------
function renderOverview() {
  const html = `
    <div class="view-header">
      <h2 class="view-title">Overview</h2>
      <p class="view-subtitle">Network-wide snapshot of resource distribution across all 49 Spots.</p>
    </div>

    ${renderKPIBar()}

    <div class="charts-grid">
      <div class="chart-card">
        <h3 class="chart-title">Distribution by resource type — last 12 months</h3>
        <div class="chart-wrap">
          <canvas id="trendChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">Resources on hand by RC cluster</h3>
        <div class="chart-wrap">
          <canvas id="clusterChart"></canvas>
        </div>
      </div>
    </div>
  `;
  $mainContent.innerHTML = html;
  // Charts need a tick for the canvas to be in the DOM
  requestAnimationFrame(() => initCharts());
}

// ---------------------------------------------------------------------------
// Spot Resourcing Grid View
// ---------------------------------------------------------------------------
function renderGrid() {
  const clusters = ["all", ...Object.keys(SPOT_CLUSTER_MAP)];

  const filtered = ALL_SPOTS.filter(sp => {
    const statusOk  = STATE.gridFilter.status  === "all" || sp.status === STATE.gridFilter.status;
    const clusterOk = STATE.gridFilter.cluster === "all" || sp.cluster === STATE.gridFilter.cluster;
    return statusOk && clusterOk;
  });

  const tiles = filtered.map(sp => {
    const sc = statusClass(sp.status);
    return `
      <button class="spot-tile ${sc}" data-spot="${sp.name}" aria-label="View ${sp.name} resourcing detail">
        <span class="tile-name">${sp.name}</span>
        <span class="tile-cluster">${sp.cluster}</span>
        <span class="tile-badge ${sc}">${statusLabel(sp.status)}</span>
        <span class="tile-meta">
          <span>📚 ${fmt(sp.booksOnHand)}</span>
          <span>💻 ${sp.devicesOnHand}</span>
        </span>
      </button>`;
  }).join("");

  const html = `
    <div class="view-header">
      <h2 class="view-title">Spot resourcing grid</h2>
      <p class="view-subtitle">All 49 Spots, colour-coded by resourcing status. Click a tile to view detail.</p>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <label for="gridStatusFilter" class="filter-label">Status</label>
        <select id="gridStatusFilter" class="filter-select">
          <option value="all">All statuses</option>
          <option value="well-resourced"  ${STATE.gridFilter.status === "well-resourced"  ? "selected" : ""}>Well-resourced</option>
          <option value="below-benchmark" ${STATE.gridFilter.status === "below-benchmark" ? "selected" : ""}>Below benchmark</option>
          <option value="under-resourced" ${STATE.gridFilter.status === "under-resourced" ? "selected" : ""}>Under-resourced</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="gridClusterFilter" class="filter-label">RC cluster</label>
        <select id="gridClusterFilter" class="filter-select">
          ${clusters.map(c => `<option value="${c}" ${STATE.gridFilter.cluster === c ? "selected" : ""}>${c === "all" ? "All clusters" : c}</option>`).join("")}
        </select>
      </div>
      <span class="filter-count">${filtered.length} of ${ALL_SPOTS.length} Spots</span>
    </div>

    <div class="spot-grid">
      ${tiles.length ? tiles : '<p class="empty-state">No Spots match the current filters.</p>'}
    </div>
  `;

  $mainContent.innerHTML = html;

  document.getElementById("gridStatusFilter").addEventListener("change", e => {
    STATE.gridFilter.status = e.target.value;
    renderGrid();
  });
  document.getElementById("gridClusterFilter").addEventListener("change", e => {
    STATE.gridFilter.cluster = e.target.value;
    renderGrid();
  });
  $mainContent.querySelectorAll(".spot-tile").forEach(tile => {
    tile.addEventListener("click", () => openSpotModal(tile.dataset.spot));
  });
}

// ---------------------------------------------------------------------------
// Requests & Fulfilment View
// ---------------------------------------------------------------------------
function renderRequests() {
  const filtered = ALL_REQUESTS.filter(r => {
    const statusOk = STATE.requestFilter.status === "all" || r.status === STATE.requestFilter.status;
    const typeOk   = STATE.requestFilter.type   === "all" || r.resourceType === STATE.requestFilter.type;
    return statusOk && typeOk;
  });

  // Sort
  const col = STATE.requestSortCol;
  const dir = STATE.requestSortDir === "asc" ? 1 : -1;
  const sorted = [...filtered].sort((a, b) => {
    const av = a[col] ?? "";
    const bv = b[col] ?? "";
    return av < bv ? -dir : av > bv ? dir : 0;
  });

  function sortIcon(col) {
    if (STATE.requestSortCol !== col) return '<span class="sort-icon">↕</span>';
    return STATE.requestSortDir === "asc"
      ? '<span class="sort-icon active">↑</span>'
      : '<span class="sort-icon active">↓</span>';
  }

  const rows = sorted.map(r => {
    const sc = statusClass(r.status);
    return `
      <tr class="req-row" data-req="${r.id}" tabindex="0" role="button" aria-label="View request ${r.id}">
        <td class="mono">${r.id}</td>
        <td>${r.spotName}</td>
        <td>${r.cluster}</td>
        <td>${r.resourceType}</td>
        <td class="mono">${r.quantityRequested}</td>
        <td class="mono">${fmtDate(r.dateRequested)}</td>
        <td><span class="req-badge ${sc}">${statusLabel(r.status)}</span></td>
        <td class="mono">${r.daysOpen !== null ? r.daysOpen + "d" : "—"}</td>
      </tr>`;
  }).join("");

  function thSort(col, label) {
    return `<th class="sortable" data-col="${col}">${label} ${sortIcon(col)}</th>`;
  }

  const html = `
    <div class="view-header">
      <h2 class="view-title">Requests &amp; fulfilment</h2>
      <p class="view-subtitle">${ALL_REQUESTS.length} resource requests across the network. Click any row to view detail.</p>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <label for="reqStatusFilter" class="filter-label">Status</label>
        <select id="reqStatusFilter" class="filter-select">
          <option value="all">All statuses</option>
          <option value="open"        ${STATE.requestFilter.status === "open"        ? "selected" : ""}>Open</option>
          <option value="in-progress" ${STATE.requestFilter.status === "in-progress" ? "selected" : ""}>In progress</option>
          <option value="fulfilled"   ${STATE.requestFilter.status === "fulfilled"   ? "selected" : ""}>Fulfilled</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="reqTypeFilter" class="filter-label">Resource type</label>
        <select id="reqTypeFilter" class="filter-select">
          <option value="all">All types</option>
          <option value="Books"           ${STATE.requestFilter.type === "Books"           ? "selected" : ""}>Books</option>
          <option value="Tablets"         ${STATE.requestFilter.type === "Tablets"         ? "selected" : ""}>Tablets</option>
          <option value="Other materials" ${STATE.requestFilter.type === "Other materials" ? "selected" : ""}>Other materials</option>
        </select>
      </div>
      <span class="filter-count">${filtered.length} of ${ALL_REQUESTS.length} requests</span>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            ${thSort("id",               "ID")}
            ${thSort("spotName",         "Spot")}
            ${thSort("cluster",          "RC cluster")}
            ${thSort("resourceType",     "Type")}
            ${thSort("quantityRequested","Qty")}
            ${thSort("dateRequested",    "Requested")}
            ${thSort("status",           "Status")}
            ${thSort("daysOpen",         "Days open")}
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows : '<tr><td colspan="8" class="empty-state">No requests match the current filters.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  $mainContent.innerHTML = html;

  document.getElementById("reqStatusFilter").addEventListener("change", e => {
    STATE.requestFilter.status = e.target.value;
    renderRequests();
  });
  document.getElementById("reqTypeFilter").addEventListener("change", e => {
    STATE.requestFilter.type = e.target.value;
    renderRequests();
  });

  $mainContent.querySelectorAll(".sortable").forEach(th => {
    th.addEventListener("click", () => {
      const c = th.dataset.col;
      if (STATE.requestSortCol === c) {
        STATE.requestSortDir = STATE.requestSortDir === "asc" ? "desc" : "asc";
      } else {
        STATE.requestSortCol = c;
        STATE.requestSortDir = "desc";
      }
      renderRequests();
    });
  });

  $mainContent.querySelectorAll(".req-row").forEach(row => {
    row.addEventListener("click",   () => openRequestModal(row.dataset.req));
    row.addEventListener("keydown", e => { if (e.key === "Enter") openRequestModal(row.dataset.req); });
  });
}

// ---------------------------------------------------------------------------
// Under-resourced Spots View
// ---------------------------------------------------------------------------
function renderFlagged() {
  const flagged = ALL_SPOTS.filter(sp =>
    sp.status === "under-resourced" || sp.status === "below-benchmark"
  ).sort((a, b) => {
    const order = { "under-resourced": 0, "below-benchmark": 1 };
    return order[a.status] - order[b.status];
  });

  const cards = flagged.map(sp => {
    const sc  = statusClass(sp.status);
    const ack = STATE.acknowledgedSpots.has(sp.name);
    const reasonList = sp.reasons
      .filter(r => r !== "All resourcing indicators within benchmark")
      .map(r => `<li class="flag-reason">${r}</li>`)
      .join("");

    return `
      <div class="flag-card ${sc}" data-spot="${sp.name}">
        <div class="flag-card-header">
          <div>
            <span class="flag-spot-name">${sp.name}</span>
            <span class="flag-cluster">${sp.cluster}</span>
          </div>
          <span class="tile-badge ${sc}">${statusLabel(sp.status)}</span>
        </div>
        <ul class="flag-reasons">${reasonList}</ul>
        <div class="flag-meta">
          <span>📚 ${fmt(sp.booksOnHand)} books on hand</span>
          <span>💻 ${sp.devicesOnHand} devices on hand</span>
          <span>👥 ${sp.sparksReached} Sparks reached</span>
          <span>Last distribution: ${fmtDate(sp.lastDistribDate)}</span>
        </div>
        <div class="flag-actions">
          ${ack
            ? `<span class="ack-badge">✓ Acknowledged for follow-up</span>`
            : `<button class="btn-acknowledge" data-spot="${sp.name}">Acknowledge for follow-up</button>`}
          <button class="btn-ghost view-spot-btn" data-spot="${sp.name}">View Spot detail →</button>
        </div>
      </div>`;
  }).join("");

  const html = `
    <div class="view-header">
      <h2 class="view-title">Under-resourced Spots</h2>
      <p class="view-subtitle">
        ${flagged.length} Spot${flagged.length !== 1 ? "s" : ""} flagged below benchmark or under-resourced.
        Acknowledging a Spot marks that an RC or HQ team member has taken ownership of the review —
        it does not create or fulfil a request.
      </p>
    </div>

    <div class="flagged-list">
      ${cards.length ? cards : '<p class="empty-state">No Spots are currently flagged. All Spots are within the resourcing benchmark.</p>'}
    </div>
  `;

  $mainContent.innerHTML = html;

  $mainContent.querySelectorAll(".btn-acknowledge").forEach(btn => {
    btn.addEventListener("click", () => {
      STATE.acknowledgedSpots.add(btn.dataset.spot);
      renderFlagged();
    });
  });

  $mainContent.querySelectorAll(".view-spot-btn").forEach(btn => {
    btn.addEventListener("click", () => openSpotModal(btn.dataset.spot));
  });
}

// ---------------------------------------------------------------------------
// Spot Detail Modal
// ---------------------------------------------------------------------------
function openSpotModal(spotName) {
  const sp = ALL_SPOTS.find(s => s.name === spotName);
  if (!sp) return;

  const sc = statusClass(sp.status);
  const openReqs = ALL_REQUESTS.filter(r => r.spotName === sp.name && r.status !== "fulfilled");
  const allReqs  = ALL_REQUESTS.filter(r => r.spotName === sp.name);

  const reqRows = allReqs.length
    ? allReqs.map(r => {
        const rsc = statusClass(r.status);
        return `
          <tr>
            <td class="mono">${r.id}</td>
            <td>${r.resourceType}</td>
            <td class="mono">${r.quantityRequested}</td>
            <td class="mono">${fmtDate(r.dateRequested)}</td>
            <td><span class="req-badge ${rsc}">${statusLabel(r.status)}</span></td>
            <td class="mono">${r.daysOpen !== null ? r.daysOpen + "d" : "—"}</td>
          </tr>`;
      }).join("")
    : '<tr><td colspan="6" class="empty-state">No requests on record for this Spot.</td></tr>';

  const reasonList = sp.reasons
    .filter(r => r !== "All resourcing indicators within benchmark")
    .map(r => `<li>${r}</li>`)
    .join("");

  $modal.innerHTML = `
    <div class="modal-header">
      <div>
        <h2 class="modal-title">${sp.name}</h2>
        <span class="modal-sub">${sp.cluster}</span>
      </div>
      <div class="modal-header-right">
        <span class="tile-badge ${sc}">${statusLabel(sp.status)}</span>
        <button class="modal-close" id="modalClose" aria-label="Close">✕</button>
      </div>
    </div>

    <div class="modal-body">
      <div class="detail-grid">
        <div class="detail-card">
          <span class="detail-label">Books on hand (estimate)</span>
          <span class="detail-value">${fmt(sp.booksOnHand)}</span>
        </div>
        <div class="detail-card">
          <span class="detail-label">Devices on hand</span>
          <span class="detail-value">${sp.devicesOnHand}</span>
        </div>
        <div class="detail-card">
          <span class="detail-label">Sparks reached</span>
          <span class="detail-value">${sp.sparksReached}</span>
        </div>
        <div class="detail-card">
          <span class="detail-label">Last distribution</span>
          <span class="detail-value">${fmtDate(sp.lastDistribDate)}</span>
        </div>
      </div>

      ${reasonList ? `
        <div class="modal-section">
          <h3 class="modal-section-title">Flagged reasons</h3>
          <ul class="modal-reasons">${reasonList}</ul>
        </div>` : ""}

      <div class="modal-section">
        <h3 class="modal-section-title">Requests (${allReqs.length} total, ${openReqs.length} open)</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Type</th><th>Qty</th><th>Requested</th><th>Status</th><th>Days open</th>
              </tr>
            </thead>
            <tbody>${reqRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  $modalOverlay.classList.add("open");
  document.getElementById("modalClose").addEventListener("click", closeModal);
}

// ---------------------------------------------------------------------------
// Request Detail Modal
// ---------------------------------------------------------------------------
function openRequestModal(reqId) {
  const r = ALL_REQUESTS.find(req => req.id === reqId);
  if (!r) return;

  const rsc = statusClass(r.status);
  const sp  = ALL_SPOTS.find(s => s.name === r.spotName);
  const sc  = sp ? statusClass(sp.status) : "";

  $modal.innerHTML = `
    <div class="modal-header">
      <div>
        <h2 class="modal-title mono">${r.id}</h2>
        <span class="modal-sub">${r.spotName} · ${r.cluster}</span>
      </div>
      <div class="modal-header-right">
        <span class="req-badge ${rsc}">${statusLabel(r.status)}</span>
        <button class="modal-close" id="modalClose" aria-label="Close">✕</button>
      </div>
    </div>

    <div class="modal-body">
      <div class="detail-grid">
        <div class="detail-card">
          <span class="detail-label">Resource type</span>
          <span class="detail-value">${r.resourceType}</span>
        </div>
        <div class="detail-card">
          <span class="detail-label">Quantity requested</span>
          <span class="detail-value">${r.quantityRequested}</span>
        </div>
        <div class="detail-card">
          <span class="detail-label">Date requested</span>
          <span class="detail-value mono">${fmtDate(r.dateRequested)}</span>
        </div>
        <div class="detail-card">
          <span class="detail-label">Fulfilment date</span>
          <span class="detail-value mono">${fmtDate(r.fulfillmentDate)}</span>
        </div>
        <div class="detail-card">
          <span class="detail-label">Days open</span>
          <span class="detail-value mono">${r.daysOpen !== null ? r.daysOpen + " days" : "—"}</span>
        </div>
        <div class="detail-card">
          <span class="detail-label">Source / partner</span>
          <span class="detail-value">${r.sourceNote || "—"}</span>
        </div>
      </div>

      ${sp ? `
        <div class="modal-section">
          <h3 class="modal-section-title">Spot context</h3>
          <div class="detail-grid">
            <div class="detail-card">
              <span class="detail-label">Spot status</span>
              <span class="detail-value"><span class="tile-badge ${sc}">${statusLabel(sp.status)}</span></span>
            </div>
            <div class="detail-card">
              <span class="detail-label">Devices on hand</span>
              <span class="detail-value">${sp.devicesOnHand}</span>
            </div>
            <div class="detail-card">
              <span class="detail-label">Sparks reached</span>
              <span class="detail-value">${sp.sparksReached}</span>
            </div>
            <div class="detail-card">
              <span class="detail-label">Last distribution</span>
              <span class="detail-value mono">${fmtDate(sp.lastDistribDate)}</span>
            </div>
          </div>
        </div>` : ""}
    </div>
  `;

  $modalOverlay.classList.add("open");
  document.getElementById("modalClose").addEventListener("click", closeModal);
}

// ---------------------------------------------------------------------------
// Close modal
// ---------------------------------------------------------------------------
function closeModal() {
  $modalOverlay.classList.remove("open");
}

// ---------------------------------------------------------------------------
// Main render dispatcher
// ---------------------------------------------------------------------------
function renderMain() {
  switch (STATE.activeView) {
    case "overview":  renderOverview(); break;
    case "grid":      renderGrid();     break;
    case "requests":  renderRequests(); break;
    case "flagged":   renderFlagged();  break;
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  $mainContent  = document.getElementById("mainContent");
  $navLinks     = document.querySelectorAll("[data-view]");
  $modalOverlay = document.getElementById("modalOverlay");
  $modal        = document.getElementById("modal");

  // Nav click
  $navLinks.forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      setView(el.dataset.view);
    });
  });

  // Close modal on overlay click
  $modalOverlay.addEventListener("click", e => {
    if (e.target === $modalOverlay) closeModal();
  });

  // Close on Escape
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });

  // Initial render
  renderMain();
});
