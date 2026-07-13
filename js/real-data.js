// real-data.js — EduSpots Resource & Device Distribution Tracker
// This file contains real, publicly available facts about EduSpots.
// ALL book counts, device counts, distribution dates, and request data are synthetic.
//
// Sources:
//   Spot names:    https://eduspots.org/
//   RC names:      https://eduspots.org/about-us/team/
//   Book Aid Int'l: https://eduspots.org/ (named partner, public)

const REAL_REGIONAL_COORDINATORS = [
  { name: "Cynthia Mawuena Tetteh", region: "Volta Region" },
  { name: "Getrude Akunlibe",        region: "Northern Region" },
  { name: "Abdul Wadud Suleiman",    region: "Central/Western Regions" },
  { name: "Abdul-Malik Iddrisu",     region: "New Spots" },
];

const REAL_SPOT_NAMES = [
  "Aboabo No.4",      "Abofour",          "Abutia",           "Agbledomi",
  "Ahenkro",          "Akumadan",         "Ameyaw",           "Asemasa",
  "Atanve",           "Banda Kabrono",    "Bimbilla",         "Bono Manso",
  "Bosomadwe",        "Dadwen",           "Dodome Awuiasu",   "Donkorkrom",
  "Dulugu",           "Ejisu-Besease",    "Ejura",            "Ekawso",
  "Ekumfi",           "Elmina",           "Funkoe",           "Gambibgo",
  "Gomoa-Manso",      "Ho-Kpenoe",        "Joska Kenya",      "Kalpohin",
  "Katanga-Zuarungu", "Kato Berekum",     "Kejabil",          "Kotokoli Zongo",
  "Kumbungu Zamigu",  "Metsrikasa",       "Mpatano",          "New Ebu",
  "Nkonya",           "Piisi",            "Posmonu",          "Sakasaka",
  "Sanzule-Krisan",   "Savelugu",         "Sefwi Asanteman",  "Soko",
  "Takuve",           "Teshie",           "Wodome",           "Yamfo",
  "Zangbalun",
]; // 49 Spots — source: eduspots.org

// RC cluster assignment — distributes Spots across the four RC regions.
// Assignments are approximate/synthetic; the real mapping is not public.
const SPOT_CLUSTER_MAP = {
  "Volta Region":          ["Abutia","Agbledomi","Atanve","Dadwen","Dodome Awuiasu",
                            "Ho-Kpenoe","Takuve","Wodome","Funkoe","Nkonya"],
  "Northern Region":       ["Banda Kabrono","Bimbilla","Dulugu","Gambibgo","Kalpohin",
                            "Katanga-Zuarungu","Kejabil","Kotokoli Zongo","Kumbungu Zamigu",
                            "Piisi","Posmonu","Sakasaka","Savelugu","Soko","Zangbalun"],
  "Central/Western Regions":["Aboabo No.4","Abofour","Ahenkro","Akumadan","Ameyaw",
                              "Asemasa","Bono Manso","Bosomadwe","Donkorkrom","Ejisu-Besease",
                              "Ejura","Ekawso","Ekumfi","Elmina","Gomoa-Manso","Kato Berekum",
                              "Metsrikasa","Mpatano","New Ebu","Sanzule-Krisan","Sefwi Asanteman",
                              "Teshie","Yamfo"],
  "New Spots":             ["Joska Kenya"],
};

// Reverse lookup: Spot name → RC cluster
const SPOT_TO_CLUSTER = {};
for (const [cluster, spots] of Object.entries(SPOT_CLUSTER_MAP)) {
  for (const spot of spots) SPOT_TO_CLUSTER[spot] = cluster;
}

// Real, publicly named resource partner (source: eduspots.org / partner reporting).
// Used only as a plausible source-note label; not a claim about specific real
// shipments, quantities, or distribution dates.
const REAL_RESOURCE_PARTNERS = [
  "Book Aid International", // named partner per eduspots.org
  "Local purchase",
  "Community donation",
  "Partner donation",
];
