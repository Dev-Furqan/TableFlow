# Orange Restaurant Website integration

## Architecture and ownership

The POS and Orange Restaurant Website retain separate deployments and MongoDB databases. They communicate only over HTTPS backend APIs signed with a shared HMAC secret. POS is authoritative for categories, menu items, prices, availability, and menu deletion; the website only creates online orders and the associated customer/delivery information. Website-origin orders receive POS status updates, but inbound menu events are never echoed back.

`Category.externalId` and `MenuItem.externalId` are UUIDs shared with the website. Run `npm run integration:backfill-ids -w @tableflow/server` once before the first full sync to assign IDs to old records; MongoDB `_id` values are never shared.

## Required environment

```dotenv
INTEGRATION_ENABLED=true
ORANGE_WEBSITE_API_URL=https://orange-restaurant.example.com
ORANGE_WEBSITE_SYNC_SECRET=a-long-random-shared-secret-at-least-32-characters
INTEGRATION_WORKER_INTERVAL_MS=10000
INTEGRATION_MAX_ATTEMPTS=8
INTEGRATION_REPLAY_WINDOW_SECONDS=300
```

Keep the secret in each deployment’s secret store, not source control. Set the website URL to the Orange backend origin; POS posts outbound events to `${ORANGE_WEBSITE_API_URL}/api/integration/events`.

## Event envelope and outbound delivery

Every outbox record contains an immutable envelope:

```json
{"eventId":"9a4b...","type":"MENU_ITEM_UPDATED","occurredAt":"2026-08-12T12:00:00.000Z","source":"pos","version":1,"data":{"externalId":"d2d...","name":"Smash Classic","price":890,"categoryExternalId":"c1c...","available":true}}
```

Types: `MENU_ITEM_CREATED`, `MENU_ITEM_UPDATED`, `MENU_ITEM_DELETED`, `MENU_AVAILABILITY_UPDATED`, `CATEGORY_CREATED`, `CATEGORY_UPDATED`, `CATEGORY_DELETED`, and `ORDER_STATUS_UPDATED`. The menu DTO also exposes only customer-safe fields: description, image, SKU, tags, supported modifier/variant/add-on data and current availability. It deliberately excludes cost, internal IDs, and other POS-only fields.

The worker claims pending records from the `IntegrationEvent` collection and posts them to the website. Success becomes `completed`; errors are retried with capped exponential backoff (1 second through 1 hour). After `INTEGRATION_MAX_ATTEMPTS`, an event is `failed` and remains visible for manual retry. Disabled integration retains newly created events but does not attempt delivery.

## Signing

For every direction, serialize the exact JSON body, build the bytes/text `timestamp + "." + rawBody`, and calculate a lowercase HMAC-SHA256 hex digest with `ORANGE_WEBSITE_SYNC_SECRET`.

Headers:

```text
x-integration-timestamp: 2026-08-12T12:00:00.000Z
x-integration-signature: <hmac-sha256-hex>
x-integration-event-id: <uuid>
x-integration-event-type: WEBSITE_ORDER_CREATED
content-type: application/json
```

POS rejects timestamps outside `INTEGRATION_REPLAY_WINDOW_SECONDS` and invalid signatures. The website must do the same. Both sides must deduplicate by `eventId`; POS additionally makes the website order key idempotent.

## POS endpoints

| Method | Endpoint | Protection | Purpose |
| --- | --- | --- | --- |
| POST | `/api/integration/orders` | HMAC | Accept website order |
| GET | `/api/integration/health` | POS owner/manager JWT | Pending/failed state and latest success |
| POST | `/api/integration/events/:id/retry` | POS owner/manager JWT | Retry one event |
| POST | `/api/integration/events/retry-failed` | POS owner/manager JWT | Retry all failed events |
| POST | `/api/integration/resync/menu` | POS owner/manager JWT | Queue safe category/menu upserts |

Example website order (the submitted `price` is accepted syntactically but ignored):

```json
{"externalOrderId":"orange-order-1042","orderType":"delivery","customer":{"name":"Amina","phone":"03001234567","address":"12 Market Street"},"deliveryAddress":"12 Market Street","notes":"No onions","paymentMethod":"cash","items":[{"externalMenuItemId":"d2d6e4fc-3333-4444-8888-111111111111","quantity":2,"price":1,"modifiers":[{"label":"Extra cheddar"}]}]}
```

Successful first delivery returns `201`:

```json
{"data":{"_id":"...","externalOrderId":"orange-order-1042","source":"orange-website","status":"pending","total":2300},"idempotent":false}
```

Repeating the same `externalOrderId` returns the original POS order with `200` and `idempotent: true`. Unknown, disabled, or unavailable menu IDs and invalid modifiers return `422`; the server always derives line price, modifiers, totals, tax and service charges from POS configuration. No card data is accepted or stored.

For an accepted website-originated order, POS emits:

```json
{"eventId":"...","type":"ORDER_STATUS_UPDATED","occurredAt":"...","source":"pos","version":1,"data":{"externalOrderId":"orange-order-1042","posOrderId":"...","status":"preparing","occurredAt":"..."}}
```

POS maps its existing statuses without renaming them: `draft`/`pending` → `pending`, `sent-to-kitchen` → `accepted`, `preparing` → `preparing`, `ready` → `ready`, `served` → `out_for_delivery`, `completed` → `completed`, and `cancelled`/`refunded` → `cancelled`.

## Safe rollout and diagnosis

1. Deploy this POS version with `INTEGRATION_ENABLED=false`.
2. Run the backfill script and confirm unique indexes complete.
3. Implement and deploy the matching Orange backend receiver, including HMAC/replay/event-ID dedupe, then set both secrets identically.
4. Enable POS integration, call the admin menu-resync endpoint once, and monitor `/api/integration/health`.
5. Retry failed records after correcting endpoint/secret/network issues; do not delete them as an operational workaround.

The normal POS server starts the worker automatically. If your HTTP deployment is serverless, deploy `npm run integration:worker -w @tableflow/server` as a separate always-on process against the same POS MongoDB; serverless request handlers are not a durable background-worker runtime.

The Orange backend must implement `POST /api/integration/events`, verify the exact raw body signature, reject stale/replayed events, and upsert menus/categories by `externalId`. It must send signed `POST /api/integration/orders` requests with a persistent `externalOrderId`, retain that idempotency key across retries, and consume normalized order statuses. It should never query the POS MongoDB.
