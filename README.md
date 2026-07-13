# Resource & Device Distribution Tracker

![Status: Prototype](https://img.shields.io/badge/status-prototype-orange)

> **Maps to this line in the EduSpots Head of Programme & Product Operations job description:**
> *"Oversight of books and wider resource and device distribution across the network."*

A network-wide operational dashboard for tracking book and device distribution across EduSpots' 50+ community learning hubs ("Spots"). Built as a working prototype to demonstrate how informal or spreadsheet-based distribution tracking could be consolidated into a single view — surfacing which Spots are under-resourced, which requests have been open too long, and where distribution is uneven across RC clusters.

---

## How it works

Data is generated with a seeded random number generator, so every run produces the same reproducible demo dataset. All 49 real EduSpots Spot names and the four named Regional Coordinators are used exactly as published. Every specific book count, device count, distribution date, and resource request is synthetic.

Status is computed by clearly named functions (`computeResourcingStatus`, `computeRequestStatus`) with transparent rules — no black-box scoring. Every flagged Spot or stale request carries the specific reason it was flagged, not just a colour.

### The AI/human split

This tool surfaces gaps and flags issues; a human decides what gets allocated and to whom.

That principle is worth stating plainly here because it's the less dramatic version of the same rule that runs through all five projects in this portfolio. There's no safeguarding risk in a distribution tracker — no one gets hurt if a book shipment is flagged incorrectly. But the logic still holds: automation that tells you *what to notice* is useful; automation that decides *what to do about it* removes the human judgment that resource allocation decisions require. An RC looking at the under-resourced Spots view can see exactly why a Spot is flagged and make a call based on context the tool doesn't have — whether a distribution is already en route, whether a Spot has a temporary closure, whether Book Aid International has a shipment incoming. The tool never decides for them.

---

## Views

### Overview
KPI row showing total books and devices distributed across the network, open/unfulfilled requests, Spots below the resourcing benchmark, and average request-to-fulfilment time. Two charts: a 12-month stacked bar of distribution by resource type (books / tablets / other materials), and a grouped bar of resources on hand by RC cluster (to spot whether resourcing is roughly even or lopsided).

### Spot resourcing grid
All 49 Spots as colour-coded tiles — the same visual pattern used in Project #1's Spot health grid. Filterable by resourcing status (well-resourced / below benchmark / under-resourced) and by RC cluster. Clicking any tile opens a detail modal showing books and devices on hand, last distribution date, Sparks reached, and all requests associated with that Spot.

### Requests & fulfilment
A sortable, filterable table of all resource requests across the network — the operational heart of the tool. Think of it as a lightweight ticket queue: classify, track, don't auto-resolve. Each request carries a resource type, quantity, date, status (open / in progress / fulfilled), and days open. Clicking a row opens full detail including Spot context and source/partner note.

### Under-resourced Spots
Every Spot flagged below benchmark or under-resourced, with the specific flagged reason (e.g. "No distribution logged in 10 months," "0 devices on hand — 52 Sparks reached"). An "Acknowledge for follow-up" button per Spot lets an RC or HQ team member mark that they've taken ownership of the review. Acknowledging a Spot **does not** create a request or fulfil an allocation — it only records that a human has eyes on it.

---

## Status rules

Computed per Spot by `computeResourcingStatus()`:

| Status | Conditions |
|---|---|
| **Under-resourced** | No distribution logged in 9+ months, OR 0 devices on hand while the Spot has 40+ Sparks reached, OR 2+ open requests older than 60 days |
| **Below benchmark** | No distribution logged in 4–8 months, OR 1+ open request older than 30 days |
| **Well-resourced** | None of the above |

Computed per request by `computeRequestStatus()`:

| Status | Conditions |
|---|---|
| **Open** | No fulfilment action logged yet |
| **In progress** | Partially fulfilled or flagged as being worked |
| **Fulfilled** | Fulfilment date logged |

Every flagged Spot and every open/stale request carries the specific reason — not just a status colour.

---

## Design system

Identical tokens to Projects #1–4:

| Token | Value | Used for |
|---|---|---|
| `--forest` | `#123524` | Sidebar, primary actions |
| `--forest-light` | `#1F5C3D` | Well-resourced status, hover states |
| `--gold` | `#D9A62E` | Below-benchmark status |
| `--gold-soft` | `#F0D89B` | Soft gold tints |
| `--sky` | `#3E7CB1` | Secondary data, tablets in charts |
| `--clay` | `#B54834` | Under-resourced status only — not decorative |
| `--paper` | `#F6F2E9` | Page background |
| `--panel` | `#FFFFFF` | Cards and table backgrounds |
| `--ink` | `#1A1A16` | Primary text |
| `--muted` | `#6B6558` | Labels, secondary text |

Fonts: Space Grotesk (headings/display), IBM Plex Sans (body), IBM Plex Mono (IDs/timestamps/badges) — via Google Fonts CDN.

Sidebar: dark forest green, sticky/pinned to viewport height, with a Kente-inspired multi-stripe accent bar on the right edge.

---

## Stack

- Plain HTML, CSS, and JavaScript — no build step, no npm install required
- Chart.js 4.4.3 via CDN for charts
- Seeded RNG (`mulberry32`) for reproducible synthetic data

```
eduspots-resource-tracker/
  index.html
  css/styles.css
  js/data.js          seeded synthetic generator + status rules
  js/real-data.js     real Spot/RC/partner facts
  js/charts.js        Chart.js wrappers
  js/app.js           rendering, nav, filters, modals
  assets/             logo and favicon
  README.md
  LICENSE
  .gitignore
```

To run locally: open `index.html` in any modern browser. No server required.

---

## Real vs synthetic data

**Real, sourced data:**
- All 49 Spot names are real, as published on [eduspots.org](https://eduspots.org/)
- The four Regional Coordinator names and regions are real, from the [EduSpots team page](https://eduspots.org/about-us/team/)
- Book Aid International is a real, publicly named EduSpots partner (source: eduspots.org), used only as a plausible source-note label

**Synthetic, for demo purposes only:**
- All book and device counts
- All distribution dates and last-distribution records
- All resource requests, quantities, fulfilment dates, and days-open values
- All cluster assignments (the real RC-to-Spot mapping is not public)

No claims are made about actual inventory levels, distribution history, or request status at any specific Spot.

---

## Roadmap

- Live data connection to a shared sheet or simple backend
- Email/Slack alerts for requests open beyond threshold
- Export to CSV for RC cluster reporting
- Per-Spot distribution history timeline
- Integration with Project #1 (Spot Health & MEL Dashboard) to cross-reference resourcing status with activity/safeguarding compliance

---

## Part of a 5-project portfolio

This is the fifth and final prototype in a portfolio built for the **EduSpots Head of Programme & Product Operations** application, mapping directly to duties named in the job description.

| # | Project | What it does |
|---|---|---|
| 1 | **Spot Health & MEL Dashboard** | Network-wide monitoring, safeguarding compliance signals, anomaly flagging across all Spots |
| 2 | **Catalyst Onboarding & Induction Pipeline Tracker** | 6-step induction pipeline with stalled-Catalyst flagging and RC oversight |
| 3 | **Funding & Impact Report Generator** | Drafts audience-specific reports from one dataset, with mandatory "DRAFT — human review required" banner |
| 4 | **Safeguarding Training Compliance Tracker** | Training dates and compliance status only — structurally excludes conduct/incident data |
| 5 | **Resource & Device Distribution Tracker** | This project — network-wide view of book/device distribution, open requests, and under-resourced Spots |

All five projects share a common design system, the same stack (dependency-free HTML/CSS/JS), and the same principle: automation surfaces what to notice; a human decides what to do about it.

---

## Licence

MIT — see [LICENSE](LICENSE).
