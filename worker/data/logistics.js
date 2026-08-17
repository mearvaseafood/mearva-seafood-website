// Mearva Seafood — structured logistics data (Phase 2A scaffolding).
// ---------------------------------------------------------------------------
// ALL operational values (transit time, temperature requirements, freight rate,
// provider, validity) are null / "pending_verification" with verified:false
// until Mearva provides verified real data from logistics providers.
//
// NEVER put example freight rates or transit times here, and NEVER record a
// provider as confirmed. Mearva is currently contacting logistics providers
// (e.g. refrigerated inland transport and air-freight forwarders); those names
// are outreach candidates only and MUST NOT be surfaced to customers or stored
// as confirmed. Keep provider = null until a relationship is verified.
//
// Scaffolding only: not imported by worker.js; does not change behaviour.
// ---------------------------------------------------------------------------

export const PENDING = "pending_verification";

function emptyRoute(fields) {
  return {
    id: fields.id,
    description: fields.description,
    pickup_location: null, // e.g. producing establishment / Norwegian airport
    destination_airport: null, // e.g. Saudi/GCC destination airport
    refrigerated_inland_transport: null, // mode / conditions
    air_freight: null, // service / class
    handling: null,
    transit_time: null,
    temperature_requirements: null,
    freight_rate: { value: null, currency: null, unit: null },
    rate_date: null,
    validity: null,
    provider: null, // stays null — never store an unconfirmed provider name
    verified: false,
    notes: "",
  };
}

// Working direction from the KB (fresh salmon → air freight to Saudi/GCC) is a
// *direction under evaluation*, not a confirmed route — all values remain null.
export const ROUTES = [
  emptyRoute({
    id: "no_to_sa_air_fresh_salmon",
    description: "Norway -> Saudi Arabia, fresh salmon, air freight (working direction, unconfirmed)",
  }),
  emptyRoute({
    id: "no_to_gcc_air_fresh",
    description: "Norway -> GCC, fresh/chilled, air freight (unconfirmed)",
  }),
  emptyRoute({
    id: "no_to_gcc_sea_frozen",
    description: "Norway -> GCC, frozen, sea/road freight (unconfirmed)",
  }),
];

export default ROUTES;
