// data.js — EduSpots Resource & Device Distribution Tracker
// Synthetic data generated with a seeded RNG for reproducibility.
// ALL specific counts, dates, and request records are invented for demo purposes.

// ---------------------------------------------------------------------------
// Seeded RNG — mulberry32 (same approach as Projects #1–4)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20240901);

function randInt(min, max)    { return Math.floor(rng() * (max - min + 1)) + min; }
function randFrom(arr)        { return arr[Math.floor(rng() * arr.length)]; }
function randBool(p)          { return rng() < p; }

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function daysAgo(n) {
  const d = new Date("2025-07-01");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(dateStr) {
  const then = new Date(dateStr);
  const now  = new Date("2025-07-01");
  return Math.floor((now - then) / 86400000);
}

// ---------------------------------------------------------------------------
// Status rules — transparent, named functions (see README §3)
// ---------------------------------------------------------------------------

/**
 * computeResourcingStatus(spot)
 *
 * Returns { status, reasons[] } for a Spot.
 *   "under-resourced" — no distribution in 9+ months, OR 0 devices & 40+ Sparks,
 *                       OR 2+ open requests older than 60 days.
 *   "below-benchmark" — no distribution in 4–8 months, OR 1 open request older
 *                       than 30 days.
 *   "well-resourced"  — none of the above.
 */
function computeResourcingStatus(spot) {
  const reasons = [];

  const monthsSinceDistrib = spot.daysSinceLastDistribution / 30.44;
  const oldOpenRequests    = spot.openRequests.filter(r => r.daysOpen >= 60).length;
  const oldishRequests     = spot.openRequests.filter(r => r.daysOpen >= 30).length;

  let tier = "well-resourced";

  // Under-resourced conditions
  if (spot.daysSinceLastDistribution >= 274) { // 9 months
    reasons.push(`No distribution logged in ${Math.round(monthsSinceDistrib)} months`);
    tier = "under-resourced";
  }
  if (spot.devicesOnHand === 0 && spot.sparksReached >= 40) {
    reasons.push(`0 devices on hand — ${spot.sparksReached} Sparks reached`);
    tier = "under-resourced";
  }
  if (oldOpenRequests >= 2) {
    reasons.push(`${oldOpenRequests} open requests older than 60 days`);
    tier = "under-resourced";
  }

  // Below-benchmark conditions (only if not already under-resourced)
  if (tier !== "under-resourced") {
    if (spot.daysSinceLastDistribution >= 122 && spot.daysSinceLastDistribution < 274) { // 4–8 months
      reasons.push(`No distribution logged in ${Math.round(monthsSinceDistrib)} months`);
      tier = "below-benchmark";
    }
    if (oldishRequests >= 1 && tier !== "below-benchmark") {
      reasons.push(`${oldishRequests} open request${oldishRequests > 1 ? "s" : ""} older than 30 days`);
      tier = "below-benchmark";
    }
    if (oldishRequests >= 1 && tier === "below-benchmark") {
      // Already set; add reason if not duplicate
      const alreadyListed = reasons.some(r => r.includes("open request"));
      if (!alreadyListed) reasons.push(`${oldishRequests} open request${oldishRequests > 1 ? "s" : ""} older than 30 days`);
    }
  }

  if (reasons.length === 0) reasons.push("All resourcing indicators within benchmark");

  return { status: tier, reasons };
}

/**
 * computeRequestStatus(request)
 *
 * Returns the status string for a resource request.
 *   "fulfilled"   — fulfillmentDate is set.
 *   "in-progress" — inProgressFlag is true, no fulfillment date yet.
 *   "open"        — no action logged.
 */
function computeRequestStatus(request) {
  if (request.fulfillmentDate) return "fulfilled";
  if (request.inProgressFlag)  return "in-progress";
  return "open";
}

// ---------------------------------------------------------------------------
// Generate synthetic resource requests (25–35)
// ---------------------------------------------------------------------------
const RESOURCE_TYPES = ["Books", "Tablets", "Other materials"];

function generateRequests(spots) {
  const count = randInt(28, 33);
  const requests = [];

  for (let i = 0; i < count; i++) {
    const spot         = randFrom(spots);
    const resourceType = randFrom(RESOURCE_TYPES);
    const daysAgoVal   = randInt(2, 400);
    const dateReq      = daysAgo(daysAgoVal);
    const daysOpenRaw  = daysBetween(dateReq);

    // Weight: ~55% fulfilled, ~15% in-progress, ~30% open
    const roll = rng();
    let fulfillmentDate = null;
    let inProgressFlag  = false;
    if (roll < 0.55) {
      const daysToFulfil = randInt(5, Math.min(daysOpenRaw, 90));
      const fd = new Date(dateReq);
      fd.setDate(fd.getDate() + daysToFulfil);
      fulfillmentDate = fd.toISOString().slice(0, 10);
    } else if (roll < 0.70) {
      inProgressFlag = true;
    }

    const status   = computeRequestStatus({ fulfillmentDate, inProgressFlag });
    const daysOpen = fulfillmentDate
      ? daysBetween(dateReq) - daysBetween(fulfillmentDate)
      : daysOpenRaw;

    const sourceNote = randBool(0.45)
      ? (resourceType === "Books" && randBool(0.6)
          ? "Partner donation — Book Aid International"
          : randFrom(["Local purchase", "Community donation", "Partner donation"]))
      : null;

    requests.push({
      id:               `REQ-${String(i + 1).padStart(3, "0")}`,
      spotName:         spot.name,
      cluster:          spot.cluster,
      resourceType,
      quantityRequested: randInt(5, 120),
      dateRequested:    dateReq,
      fulfillmentDate,
      inProgressFlag,
      status,
      daysOpen:         status === "fulfilled" ? null : daysOpenRaw,
      sourceNote,
    });
  }

  // Sort newest first
  return requests.sort((a, b) => b.dateRequested.localeCompare(a.dateRequested));
}

// ---------------------------------------------------------------------------
// Generate per-Spot resourcing data
// ---------------------------------------------------------------------------
function generateSpotData() {
  const spots = [];

  REAL_SPOT_NAMES.forEach(name => {
    const cluster = SPOT_TO_CLUSTER[name] || "Unknown";

    // Weight: ~65% well-resourced, ~20% below-benchmark, ~15% under-resourced
    const roll = rng();
    let daysSinceLastDistribution;
    if (roll < 0.65) {
      daysSinceLastDistribution = randInt(10, 110); // recent
    } else if (roll < 0.85) {
      daysSinceLastDistribution = randInt(122, 260); // 4–8.5 months
    } else {
      daysSinceLastDistribution = randInt(274, 500); // 9+ months
    }

    const sparksReached  = randInt(15, 180);
    const devicesOnHand  = roll > 0.85 && randBool(0.45) ? 0 : randInt(1, 28);
    const booksOnHand    = randInt(20, 450);
    const lastDistribDate = daysAgo(daysSinceLastDistribution);

    spots.push({
      name,
      cluster,
      sparksReached,
      booksOnHand,
      devicesOnHand,
      lastDistribDate,
      daysSinceLastDistribution,
      openRequests: [], // filled in after request generation
    });
  });

  return spots;
}

// ---------------------------------------------------------------------------
// Stitch together and attach open requests to Spots
// ---------------------------------------------------------------------------
function buildDataset() {
  const spots    = generateSpotData();
  const requests = generateRequests(spots);

  // Attach open (non-fulfilled) requests to their Spot for status computation
  for (const req of requests) {
    if (req.status !== "fulfilled") {
      const spot = spots.find(s => s.name === req.spotName);
      if (spot) spot.openRequests.push(req);
    }
  }

  // Compute final status per Spot
  for (const spot of spots) {
    const { status, reasons } = computeResourcingStatus(spot);
    spot.status  = status;
    spot.reasons = reasons;
  }

  return { spots, requests };
}

// ---------------------------------------------------------------------------
// Summary / KPI helpers
// ---------------------------------------------------------------------------
function computeKPIs(spots, requests) {
  const totalBooks   = spots.reduce((s, sp) => s + sp.booksOnHand, 0);
  const totalDevices = spots.reduce((s, sp) => s + sp.devicesOnHand, 0);
  const openReqs     = requests.filter(r => r.status === "open" || r.status === "in-progress").length;
  const underResourced = spots.filter(s => s.status === "under-resourced" || s.status === "below-benchmark").length;

  const fulfilledWithDates = requests.filter(r => r.fulfillmentDate && r.dateRequested);
  const avgFulfillDays = fulfilledWithDates.length
    ? Math.round(
        fulfilledWithDates.reduce((sum, r) => {
          return sum + daysBetween(r.dateRequested) - daysBetween(r.fulfillmentDate);
        }, 0) / fulfilledWithDates.length
      )
    : null;

  return { totalBooks, totalDevices, openReqs, underResourced, avgFulfillDays };
}

// ---------------------------------------------------------------------------
// Monthly distribution data for the 12-month trend chart
// ---------------------------------------------------------------------------
function computeMonthlyDistribution(spots) {
  // Synthetic monthly totals — seeded, so reproducible
  const months = [];
  const labels = [];
  const now = new Date("2025-07-01");

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    labels.push(d.toLocaleString("default", { month: "short", year: "2-digit" }));
    months.push({
      books:   randInt(180, 900),
      tablets: randInt(10, 120),
      other:   randInt(20, 180),
    });
  }
  return { labels, months };
}

// ---------------------------------------------------------------------------
// Cluster summary for the cluster chart
// ---------------------------------------------------------------------------
function computeClusterSummary(spots) {
  const clusters = {};
  for (const sp of spots) {
    if (!clusters[sp.cluster]) clusters[sp.cluster] = { books: 0, devices: 0, count: 0 };
    clusters[sp.cluster].books   += sp.booksOnHand;
    clusters[sp.cluster].devices += sp.devicesOnHand;
    clusters[sp.cluster].count++;
  }
  return clusters;
}

// ---------------------------------------------------------------------------
// Export a single dataset object used by app.js and charts.js
// ---------------------------------------------------------------------------
const { spots: ALL_SPOTS, requests: ALL_REQUESTS } = buildDataset();
const KPIs            = computeKPIs(ALL_SPOTS, ALL_REQUESTS);
const MONTHLY_DIST    = computeMonthlyDistribution(ALL_SPOTS);
const CLUSTER_SUMMARY = computeClusterSummary(ALL_SPOTS);
