# Ask Mearva — Phase 2 Commercial Architecture

Structured, machine-readable layer that will later hold verified supplier,
product, pricing and logistics data. **This is scaffolding (PR‑A).** It changes
**no** assistant behaviour: the files below are not imported by `worker.js`, and
all commercial values are empty until Mearva provides verified real data.

## Golden rules

1. **No fake data.** Never store example prices, freight rates, availability, or
   unconfirmed supplier/provider names. Use `null` / `"pending_verification"` and
   `verified: false`.
2. **Verified flag gates use.** The assistant/price engine may only rely on a
   value when `verified: true`. Everything ships `verified: false`.
3. **Mearva Seafood is under establishment.** Do not present *Mearva Seafood AS*
   as a legally completed company until the status is explicitly updated
   (organisation number pending).
4. **Supplier/provider names stay internal and unverified.** Outreach is ongoing
   (suppliers and logistics providers); names are candidates only, never surfaced
   to customers, never stored as confirmed. Keep `producer_supplier` / `provider`
   = `null`.

## Files

| File | Role | State |
|---|---|---|
| `worker/data/products.js` | Product catalogue (9 products incl. Saithe) | descriptive facts filled; commercial block all null/pending |
| `worker/data/logistics.js` | Routes (pickup → destination, transport, freight) | all operational values null/pending |
| `worker/data/commercial.js` | Pricing entries + cost model | `PRICES: []`; `COST_MODEL` all null; `active:false` |
| `worker/pricing.js` | Indicative price engine (Phase 2D) | **inactive** — returns `null` unless verified+active |
| `worker/confirmation.js` | Customer confirmation email (Phase 2E) | **inactive** — composes content; sends nothing until a channel is configured |

## Product record shape (`products.js`)

Descriptive (public KB facts): `id`, `name{en,ar,no}`, `species`,
`scientific_name`, `origin`, `product_status` (`primary|secondary|on_request`).
Commercial block (all null/pending, `verified:false`): `fresh`, `frozen`,
`cuts[]`, `sizes_grades[]`, `packing`, `weight{gross,net,unit}`,
`moq{value,unit}`, `certifications[]`, `producer_supplier`,
`production_or_pickup_location`, `export_documentation[]`,
`availability_status`, `notes`.

## Logistics route shape (`logistics.js`)

`pickup_location`, `destination_airport`, `refrigerated_inland_transport`,
`air_freight`, `handling`, `transit_time`, `temperature_requirements`,
`freight_rate{value,currency,unit}`, `rate_date`, `validity`, `provider`,
`verified` — all null/`false`.

## Commercial / price shape (`commercial.js`)

Price entry: `product_id`, `supplier_price`, `currency`, `price_unit`,
`price_date`, `volume_tier`, `moq`, `validity`, `source`, `verified`.
`COST_MODEL`: `supplier_cost`, `inland_refrigerated_transport`, `air_freight`,
`handling_and_documents`, `mearva_margin`, `currency`, `verified`, `active`.

## Phase 2D — indicative price engine (inactive)

Formula (only when every input is verified **and** `active:true`):

```
supplier_cost
+ inland_refrigerated_transport
+ air_freight
+ handling_and_documents
+ mearva_margin
= indicative_customer_price   (indicative only, subject to sales confirmation)
```

`computeIndicativePrice()` returns `{active:false, indicative_price:null}` today
and is **not** called anywhere. It is never shown to customers.

## Phase 2B / 2C — qualification & handoff (PR‑B, not in this PR)

- **2B qualification (conversational, only relevant fields):** buyer type
  (importer/distributor/wholesaler/hotel/restaurant/retailer/processor), product,
  cut (whole/HOG/fillet/portion), size/grade, fresh/frozen, quantity, frequency
  (one-time/recurring), destination, target delivery date, required
  certifications/documents, contact details.
- **2C internal lead summary:** customer, market, product, specification,
  quantity, frequency, destination, timeline, documentation requirements, open
  questions, qualification level, recommended next action — added to the Sales
  email, preserving the existing confirmed lead handoff and consent flow.

## Phase 2E — customer confirmation email (design; sending inactive)

Flow: **`/api/lead` succeeds (lead delivered to Sales) → then, best-effort and
isolated, `sendCustomerConfirmation()`**. If the lead fails, no confirmation is
sent. The email acknowledges receipt, summarises known enquiry fields, and states
Sales will review availability, pricing and logistics — with an explicit
disclaimer that it is **not** a price/availability/freight/delivery confirmation.
No invented data, no guarantees. Consent/privacy flow is preserved.

**Blocker:** a customer autoresponder is not available on the current Web3Forms
setup without a paid feature. `sendCustomerConfirmation()` is therefore a guarded
no-op (`reason:"not_configured"`) until a channel is chosen — **business
decision required:**
- (A) Web3Forms **PRO** autoresponder (paid), or
- (B) a transactional email provider (Resend / Postmark / MailChannels…) — needs
  a **new Worker secret**, or
- (C) Microsoft 365 SMTP — needs a **new Worker secret**.

No provider, account, or secret is added automatically.
