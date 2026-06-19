# TableFlow Restaurant POS

TableFlow is an original MERN restaurant point-of-sale and back-office application. It includes a touch-friendly register, live kitchen display, order/table management, inventory and recipes, purchasing, expenses, reporting, staff access, settings, and thermal receipt printing.

## Stack

- React 19, Vite, TypeScript, Tailwind CSS, Zustand, TanStack Query, Recharts
- Node.js, Express 5, TypeScript, MongoDB/Mongoose, JWT cookies, Socket.IO, Zod
- npm workspaces for one-command local development

## Local setup

Requirements: Node.js 20+ and MongoDB 7/8. If MongoDB is not installed, start it with Docker:

```powershell
docker compose up -d mongo
```

Then install, configure, seed, and run:

```powershell
npm install
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
npm run seed
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:4000](http://localhost:4000); `GET /health` is its health check.

For local-only defaults, the environment files are optional. Change both JWT secrets before exposing the app outside a development machine.

## Demo accounts

All demo users use password `Demo@123`.

| Role | Email |
|---|---|
| Owner | `admin@tableflow.local` |
| Manager | `manager@tableflow.local` |
| Cashier | `cashier@tableflow.local` |
| Waiter | `waiter@tableflow.local` |
| Kitchen | `kitchen@tableflow.local` |

## Useful commands

```powershell
npm run dev       # API and client with hot reload
npm run build     # production build for both workspaces
npm run seed      # reset and repopulate demo data
npm run start     # start the compiled API after build
```

## Core workflow

1. Log in as cashier or owner and open **Point of sale**.
2. Add dishes, choose modifiers, assign a table, and send the KOT.
3. Log in as kitchen staff in another browser and use **Kitchen display** to move the ticket through preparing and ready.
4. Mark the order served, complete a cash/card/wallet split, and print the 80 mm receipt.
5. Completed recipe-backed items deduct ingredients and emit low-stock alerts.

## Architecture notes

- Access and refresh JWTs are HTTP-only same-site cookies. Refresh tokens are hashed in MongoDB.
- Role gates are enforced in both navigation and API middleware; hiding a link is never treated as authorization.
- Order status transitions are validated server-side. Completion and refund inventory movements are recorded as an audit trail.
- Socket.IO publishes order, KOT, payment, table, and low-stock events with reconnect and heartbeat support.
- Money values are currently stored as numbers for readability. For a high-volume fiscal deployment, migrate them to integer minor units and add locale-specific fiscal/printer integrations.

## Production checklist

Use strong secrets, HTTPS, an Atlas/replica-set MongoDB deployment, secure CORS origins, backups, observability, a persistent upload store, and tests around local tax/fiscal requirements. Run the client behind a static host/CDN and the API behind a process manager or container platform.
