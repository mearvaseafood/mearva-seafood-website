// Mearva Seafood — indicative price engine (Phase 2D scaffolding, INACTIVE).
// ---------------------------------------------------------------------------
// Prepares the architecture for a future indicative-price calculation:
//
//   supplier_cost
//   + inland_refrigerated_transport
//   + air_freight
//   + handling_and_documents
//   + mearva_margin
//   = indicative_customer_price
//
// IMPORTANT — this engine is INACTIVE and must not be shown to customers:
// - It is NOT imported by worker.js and NOT called in any request path.
// - It returns { active:false, indicative_price:null } unless every input is
//   verified AND a margin policy is approved AND activation is explicit.
// - It never invents numbers. With no verified inputs it yields null.
//
// When real, verified data arrives, populate worker/data/commercial.js and
// enable activation here — no architectural rewrite needed.
// ---------------------------------------------------------------------------

// Returns true only if all cost components are present, numeric and verified.
function inputsAreVerified(cost) {
  if (!cost || cost.verified !== true || cost.active !== true) return false;
  const parts = [
    cost.supplier_cost,
    cost.inland_refrigerated_transport,
    cost.air_freight,
    cost.handling_and_documents,
    cost.mearva_margin,
  ];
  return parts.every((p) => typeof p === "number" && isFinite(p)) && !!cost.currency;
}

/**
 * Compute an indicative customer price from a verified cost model.
 * Currently always inactive (returns null) because no verified data exists.
 * @param {object} cost - shape of COST_MODEL from worker/data/commercial.js
 * @returns {{active:boolean, indicative_price:number|null, currency:string|null,
 *            breakdown:object|null, reason:string}}
 */
export function computeIndicativePrice(cost) {
  if (!inputsAreVerified(cost)) {
    return {
      active: false,
      indicative_price: null,
      currency: null,
      breakdown: null,
      reason: "no verified/approved commercial data — price engine inactive",
    };
  }
  const breakdown = {
    supplier_cost: cost.supplier_cost,
    inland_refrigerated_transport: cost.inland_refrigerated_transport,
    air_freight: cost.air_freight,
    handling_and_documents: cost.handling_and_documents,
    mearva_margin: cost.mearva_margin,
  };
  const indicative_price = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return {
    active: true,
    indicative_price,
    currency: cost.currency,
    breakdown,
    reason: "indicative only — subject to sales confirmation",
  };
}

export default { computeIndicativePrice };
