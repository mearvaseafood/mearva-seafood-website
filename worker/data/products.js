// Mearva Seafood — structured product catalogue (Phase 2A scaffolding).
// ---------------------------------------------------------------------------
// Descriptive fields (name, species, scientific name, origin, status) come from
// the approved knowledge base and are public educational facts.
//
// ALL commercial, availability, supplier, packing, MOQ, grade and documentation
// values are intentionally null / "pending_verification" with verified:false,
// until Mearva provides verified real data. NEVER put example prices, fake
// availability, or unconfirmed supplier names here.
//
// This file is scaffolding: it is NOT imported by worker.js yet, so it does not
// change assistant behaviour. It defines the shape future data will populate.
// ---------------------------------------------------------------------------

// Reusable "unknown, awaiting verified data" marker.
export const PENDING = "pending_verification";

// Commercial / availability block — identical shape on every product; all null
// until verified data arrives. Kept separate so it is obvious what is unknown.
function emptyCommercial() {
  return {
    fresh: null, // true/false once confirmed per product
    frozen: null,
    cuts: [], // whole / HOG / fillet / portions / other — confirmed per order
    sizes_grades: [], // e.g. 3-4kg … — confirmed per order
    packing: null,
    weight: { gross: null, net: null, unit: null },
    moq: { value: null, unit: null },
    certifications: [],
    producer_supplier: null, // MUST stay null — never name an unconfirmed supplier
    production_or_pickup_location: null,
    export_documentation: [],
    availability_status: PENDING,
    verified: false,
    notes: "",
  };
}

// Product status reflects the approved commercial priorities (KB §6, §7, §47).
export const PRODUCTS = [
  {
    id: "atlantic_salmon",
    name: { en: "Atlantic salmon", ar: "السلمون الأطلسي", no: "Atlantisk laks" },
    species: "Atlantic salmon",
    scientific_name: "Salmo salar",
    origin: "Norway",
    product_status: "primary", // primary focus for Saudi/GCC validation
    commercial: emptyCommercial(),
  },
  {
    id: "rainbow_trout",
    name: { en: "Rainbow trout", ar: "التراوت النرويجي", no: "Regnbueørret" },
    species: "Rainbow trout",
    scientific_name: "Oncorhynchus mykiss",
    origin: "Norway",
    product_status: "secondary",
    commercial: emptyCommercial(),
  },
  {
    id: "cod",
    name: { en: "Cod", ar: "سمك القد", no: "Torsk" },
    species: "Atlantic cod",
    scientific_name: "Gadus morhua",
    origin: "Norway",
    product_status: "on_request",
    commercial: emptyCommercial(),
  },
  {
    id: "saithe",
    name: { en: "Saithe", ar: "سمك الفحم (السيث)", no: "Sei" },
    species: "Saithe (coalfish)",
    scientific_name: "Pollachius virens",
    origin: "Norway",
    product_status: "on_request",
    commercial: emptyCommercial(),
  },
  {
    id: "halibut",
    name: { en: "Halibut", ar: "الهلبوت", no: "Kveite" },
    species: "Atlantic halibut",
    scientific_name: "Hippoglossus hippoglossus",
    origin: "Norway",
    product_status: "on_request",
    commercial: emptyCommercial(),
  },
  {
    id: "mackerel",
    name: { en: "Mackerel", ar: "الماكريل", no: "Makrell" },
    species: "Atlantic mackerel",
    scientific_name: "Scomber scombrus",
    origin: "Norway",
    product_status: "on_request",
    commercial: emptyCommercial(),
  },
  {
    id: "cold_water_shrimp",
    name: { en: "Cold-water shrimp / prawns", ar: "روبيان المياه الباردة", no: "Kaldtvannsreker" },
    species: "Northern prawn",
    scientific_name: "Pandalus borealis",
    origin: "Norway",
    product_status: "on_request",
    commercial: emptyCommercial(),
  },
  {
    id: "haddock",
    name: { en: "Haddock", ar: "الحدوق", no: "Hyse" },
    species: "Haddock",
    scientific_name: "Melanogrammus aeglefinus",
    origin: "Norway",
    product_status: "on_request",
    commercial: emptyCommercial(),
  },
  {
    id: "king_crab",
    name: { en: "King crab", ar: "السلطعون الملكي", no: "Kongekrabbe" },
    species: "Red king crab",
    scientific_name: "Paralithodes camtschaticus",
    origin: "Norway",
    product_status: "on_request",
    commercial: emptyCommercial(),
  },
];

export default PRODUCTS;
