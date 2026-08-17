// Mearva Seafood — structured commercial / pricing data (Phase 2A scaffolding).
// ---------------------------------------------------------------------------
// ALL pricing values are null / "pending_verification" with verified:false
// until Mearva provides approved, verified supplier pricing.
//
// NEVER put example supplier prices, margins, or customer prices here. The
// assistant must never quote a price unless a verified, approved pricing entry
// exists AND the price engine is explicitly activated (see pricing.js — inactive).
//
// Scaffolding only: not imported by worker.js; does not change behaviour.
// ---------------------------------------------------------------------------

export const PENDING = "pending_verification";

// One entry shape per (product, tier). All empty until verified data arrives.
function emptyPrice(fields) {
  return {
    product_id: fields.product_id, // matches products.js id
    supplier_price: null,
    currency: null,
    price_unit: null, // e.g. per kg
    price_date: null,
    volume_tier: null, // e.g. 100-500kg, 500kg-1t, 1t+
    moq: { value: null, unit: null },
    validity: null,
    source: null, // where the figure came from (verified supplier quote, etc.)
    verified: false,
    notes: "",
  };
}

// Cost components the (future, inactive) price engine will sum. All null now.
// Formula (inactive): supplier_cost + inland_refrigerated_transport
//                     + air_freight + handling_docs + mearva_margin
//                     = indicative_customer_price
export const COST_MODEL = {
  supplier_cost: null,
  inland_refrigerated_transport: null,
  air_freight: null,
  handling_and_documents: null,
  mearva_margin: null, // margin policy pending business decision
  currency: null,
  verified: false,
  active: false, // the price engine is NOT active; see pricing.js
};

// No verified pricing yet — start empty. Populate only with approved data.
export const PRICES = [];

// Placeholder shapes (commented) so the intended structure is documented without
// being read as real data:
//   PRICES.push(emptyPrice({ product_id: "atlantic_salmon" }));

export { emptyPrice };
export default { PRICES, COST_MODEL };
