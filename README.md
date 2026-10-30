# Showtime — UI, Backend & Database Integration Guide

This guide describes the current React application, its browser-only demo behavior, and a practical contract for connecting a real API and relational database later. It is written so the backend can replace the local data adapter without redesigning the pages.

## 1. What exists today

Showtime is a React + Vite single-page movie-ticket booking prototype. It currently runs entirely in the browser:

- **No application server, backend framework, database driver, or database connection is included.** The Vite process serves the frontend files only.
- `src/frontendStore.js` implements a local adapter that accepts `/api/...`-shaped paths and reads/writes browser `localStorage`. These strings do **not** call a server or use `fetch`.
- Demo movies, cinemas, auditoriums, seats and showtimes populate the booking experience. Local profiles, bookings, payments, and admin edits are saved in the current browser profile.
- Demo payment is marked successful immediately. This is only UI behavior; it does not charge a card.
- Ticket QR images are generated locally from per-seat ticket IDs. The current QR payload is an identifier, not a server-signed entry credential.
- Movie artwork and web fonts are static external assets. They are not the app’s data API and can fail independently of the local UI.
- Admin access is a browser demo role. It is not a security boundary and must be enforced by the future backend.

The backend boundary is `src/frontendStore.js`; the pages in `src/App.jsx` should keep receiving the same kinds of records when the adapter is switched to HTTP.

## 2. Run the current frontend

Requirements: Node.js and npm.

```powershell
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). Create or sign in to a local profile from the account menu. The profile and demo data belong to that browser only.

Useful commands:

```powershell
npm run build       # production frontend build
npm run preview     # serve the production build locally
```

## 3. Pages and current user flow

The hash routes are handled by the React app; navigation does not require separate HTML pages.

| Route | Page / behavior |
| --- | --- |
| `#home` | Landing/home page, search, movie carousel and booking entry point |
| `#movies` | Catalogue, title/genre/language filters and movie cards |
| `#movie/:movieId` | Movie details and showtimes |
| `#select/:movieId` | Choose a date, then a cinema and an available showtime |
| `#seats/:showId` | Seat map, booked-seat states, selected-seat cinema POV, quantity and fare summary |
| `#checkout` | Customer details and demo checkout |
| `#confirmation/:bookingId` | Booking/ticket details, one QR per ticket and print action |
| `#bookings` | Customer bookings; admins can review all bookings in their workspace |
| `#account` / `#login` | Browser-local demo profile and account controls |
| `#admin` | Admin metrics, sales summaries, occupancy, upcoming shows and management shortcuts |
| `#admin/movies`, `cinemas`, `screens`, `seats`, `shows`, `customers`, `bookings`, `payments`, `reports` | Admin data tables, CRUD actions where supported, filters and reports |

Important interaction details to preserve when wiring the backend:

1. A movie selection opens its show list.
2. The user chooses a **date first**; that date filters the available cinemas and each cinema’s showtime buttons.
3. Choosing a show opens a ticket-quantity dialog, then the seat map.
4. The selected show’s exact seats determine the 3D theatre camera. The user may change seats in the quick picker without leaving the POV.
5. A seat booked for a show is unavailable for that same show. Other showtimes in the same auditorium have separate availability.
6. Checkout creates a booking, per-seat tickets and a payment record in the demo. Confirmation shows a unique ticket identifier and QR for each seat.
7. Admin pages create and maintain catalogue, venue, screen, seat and showtime data; reports/dashboard are derived from the underlying booking and payment records.

## 4. Frontend architecture

| File | Responsibility |
| --- | --- |
| `src/main.jsx` | React root and stylesheet imports |
| `src/App.jsx` | Routes, page UI, booking flow, admin UI, page/hero transitions and local sign-in UI |
| `src/frontendStore.js` | Browser data adapter, fixtures, local CRUD, booking and report calculations |
| `src/CinemaPOV.jsx` | Canvas theatre view, perspective projection, seat geometry, pan/zoom and selected movie image |
| `src/qrCode.js` | Local QR SVG/data URI generation |
| `style.css`, `src/react.css`, `src/premium.css`, `src/theme.css` | Layout, responsive styles, brand theme, animation and reduced-motion behavior |
| `index.html`, `vite.config.js`, `package.json` | Vite app shell and frontend dependencies/scripts |

For integration, keep display components concerned with rendering and interaction. Put HTTP details, response normalization, and error mapping in a dedicated adapter/service layer rather than scattering direct `fetch` calls across UI components. `frontendStore.js` is the current adapter to replace or split into `apiClient.js` plus a development adapter.

## 5. Current local data shapes

IDs are numeric in the demo, but a production API should let the database own ID generation. Dates are ISO-8601 strings; prices are rupee amounts. Recommended production records:

### Movie

```json
{
  "id": 1,
  "title": "Dune: Part Two",
  "genre": "Sci-Fi",
  "language": "English",
  "duration": 166,
  "release_date": "2024-03-01",
  "rating": 8.6,
  "description": "…",
  "poster_url": "https://cdn.example/movies/dune-poster.jpg",
  "active": true
}
```

### Cinema, screen and seat

```json
{ "id": 2, "name": "INOX Megaplex", "city": "Mumbai", "address": "R-City Mall, Ghatkopar", "active": true }
```

```json
{
  "id": 4, "cinema_id": 2, "name": "Screen 1", "type": "Standard", "capacity": 48,
  "screen_width_m": 15.24, "screen_height_m": 8.57, "screen_bottom_m": 1.2,
  "front_row_distance_m": 12, "seat_pitch_m": 0.56, "seat_width_m": 0.5,
  "row_pitch_m": 1.35, "row_rise_m": 0.22, "eye_height_m": 1.12
}
```

```json
{ "id": 4001, "screen_id": 4, "row_label": "A", "seat_number": 1, "type": "Regular" }
```

Screen measurements feed `CinemaPOV`; keep the units in metres in the API and only format them for display. Seat availability is show-specific and must not be stored as one permanent `booked` flag on the seat itself.

### Showtime

```json
{
  "id": 9001, "movie_id": 1, "screen_id": 4,
  "starts_at": "2026-11-05T13:45:00+05:30", "ends_at": "2026-11-05T16:51:00+05:30",
  "price": 300, "status": "SCHEDULED"
}
```

The UI’s show list uses a joined/enriched show shape with movie title/poster, cinema/city/address, screen name, price, and start time. Return these fields together from the API or normalize them in the adapter.

### Booking, payment and ticket

Production should distinguish one booking/order from its individual seats/tickets:

```json
{
  "id": 501,
  "user_id": 17,
  "show_id": 9001,
  "status": "CONFIRMED",
  "ticket_subtotal": 600,
  "platform_fee": 50,
  "gst": 9,
  "total": 659,
  "currency": "INR",
  "created_at": "2026-10-30T10:00:00Z",
  "seats": [
    { "seat_id": 4001, "label": "A1", "ticket_id": "TKT-…", "qr_payload": "…" },
    { "seat_id": 4002, "label": "A2", "ticket_id": "TKT-…", "qr_payload": "…" }
  ],
  "payment": { "id": 702, "status": "SUCCESS", "method": "UPI", "paid_at": "2026-10-30T10:00:15Z" }
}
```

Do not trust a total, seat availability, payment result, role, or ticket ID supplied by the browser. The server must recalculate and validate all of them.

## 6. Suggested relational database model

Use a relational database such as PostgreSQL or MySQL. A normalized baseline:

```text
users(id, user_id/email UNIQUE, password_hash, display_name, role, created_at, updated_at)
movies(id, title, genre, language, duration_minutes, release_date, rating, description, poster_url, active, created_at, updated_at)
cinemas(id, name, city, address, active, created_at, updated_at)
screens(id, cinema_id FK, name, type, capacity, screen_width_m, screen_height_m,
        screen_bottom_m, front_row_distance_m, seat_pitch_m, seat_width_m,
        row_pitch_m, row_rise_m, eye_height_m, UNIQUE(cinema_id, name))
seats(id, screen_id FK, row_label, seat_number, seat_type,
      UNIQUE(screen_id, row_label, seat_number))
showtimes(id, movie_id FK, screen_id FK, starts_at, ends_at, price, status, created_at)
customers(id, user_id FK NULL, name, email, phone, created_at)
bookings(id, customer_id FK, user_id FK, showtime_id FK, status,
         ticket_subtotal, platform_fee, gst, total, currency, created_at, cancelled_at)
booking_seats(id, booking_id FK, showtime_id FK, seat_id FK, ticket_code UNIQUE,
              qr_token_hash, unit_price, created_at,
              UNIQUE(showtime_id, seat_id))
payments(id, booking_id FK UNIQUE, amount, currency, method, status,
         provider_reference, paid_at, created_at)
```

Recommended constraints and indexes:

- Foreign keys for every relation; positive prices and capacities; `ends_at > starts_at`.
- Unique seats per screen and unique `(showtime_id, seat_id)` for active/reserved sales. If cancelled seats can be resold, use a transaction-safe reservation table or a partial unique index over active reservations/bookings.
- Index `showtimes(movie_id, starts_at)`, `showtimes(screen_id, starts_at)`, `bookings(user_id, created_at)`, `booking_seats(showtime_id, seat_id)`, and payment status/time.
- Prevent overlapping scheduled shows in a screen. PostgreSQL can use an exclusion constraint on a time range; otherwise lock the screen/time range and validate in a transaction.
- Use `DECIMAL`/integer paise for money, never floating-point database columns. Return exact totals in the API.
- Keep poster files in object storage/CDN and store their stable URL; don’t put image bytes in movie rows unless there is a specific reason.

## 7. API contract to implement

The UI currently consumes the paths below through the local adapter. Implement these paths in the API, or map the adapter to a namespaced API such as `/api/admin/...`. In either design, every admin mutation and admin-only read must be checked by the server; the route name or hidden React navigation is not protection.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/movies` | Active catalogue; optionally support `?q=&genre=&language=` |
| `GET` | `/api/movies/:id` | Movie detail |
| `GET/POST/PUT/DELETE` | `/api/cinemas`, `/api/cinemas/:id` | Cinema list and admin CRUD (mutations require admin) |
| `GET/POST/PUT/DELETE` | `/api/screens`, `/api/screens/:id` | Auditorium data and admin CRUD (mutations require admin) |
| `GET/POST/PUT/DELETE` | `/api/seats`, `/api/seats/:id` | Seat inventory admin CRUD (mutations require admin) |
| `GET` | `/api/shows?movie=:id&date=YYYY-MM-DD&city=` | Scheduled shows with joined venue/movie display fields |
| `GET` | `/api/seats/:screenId?show=:showId` | Seat map with per-show availability and price tier |
| `POST` | `/api/bookings/quote` | Optional authoritative quote for show + seat count/IDs and fee/tax breakdown |
| `POST` | `/api/bookings` | Atomically reserve requested seats and create a pending order/payment intent |
| `GET` | `/api/bookings` | Current customer’s bookings; return all only for authorized admin |
| `GET` | `/api/bookings/:id` | Booking/ticket detail, authorized owner or admin |
| `POST` | `/api/bookings/:id/cancel` | Cancel according to business/refund policy and release seats if allowed |
| `GET` | `/api/account` | Current authenticated profile |
| `POST` | `/api/auth/login` | Authenticate with secure session/token |
| `POST` | `/api/auth/logout` | End session |
| `GET` | `/api/dashboard?start=&end=` | Admin metrics and summaries (admin only) |
| `GET` | `/api/reports?start=&end=&city=` | Revenue/booking summaries (admin only) |
| `GET/POST/PUT/DELETE` | `/api/movies`, `/api/movies/:id` | Catalogue reads and admin CRUD (mutations require admin) |
| `GET/POST/PUT/DELETE` | `/api/shows`, `/api/shows/:id` | Scheduled show reads and admin CRUD (mutations require admin) |
| `GET` | `/api/customers`, `/api/payments` | Admin review lists; sensitive fields must be minimized and access checked |
| `POST` | `/api/auth/login` | Suggested future secure authentication endpoint (not used by current UI adapter) |
| `POST` | `/api/auth/logout` | Suggested future session logout endpoint (not used by current UI adapter) |

List endpoints should use consistent pagination, e.g. `?page=1&page_size=25`, and return:

```json
{ "items": [], "page": 1, "page_size": 25, "total": 0 }
```

Use consistent errors so the UI can display actionable feedback:

```json
{ "error": { "code": "SEAT_UNAVAILABLE", "message": "One or more selected seats are no longer available." } }
```

Recommended HTTP statuses: `400` invalid request, `401` unauthenticated, `403` unauthorized, `404` missing record, `409` schedule/seat conflict, `422` validation, `500` unexpected server failure.

## 8. Booking and seat concurrency (important)

The browser demo checks availability before writing, which is adequate only for one browser. Real users can click the same seat concurrently, so the server must be authoritative:

1. Receive showtime ID, seat IDs and an idempotency key.
2. Start a database transaction and lock the show/seat availability rows (or attempt unique reservation inserts).
3. Validate show status and start time, seat membership, and that every requested seat is still free for **this showtime**.
4. Recalculate base price, platform fee, GST, discounts and final total on the server.
5. Create a short-lived `PENDING` reservation/order and payment intent. Do not mark paid just because the frontend submitted.
6. Confirm payment from a verified provider callback/webhook; then mark booking/payment confirmed and issue one ticket code/QR credential per seat.
7. Expire abandoned holds and release seats. Cancellation/refund should be a server policy and auditable state transition.
8. Make create/confirm/cancel idempotent so retries don’t issue duplicate orders or charges.

Return the current availability after a conflict so the UI can grey out newly booked seats and ask the user to choose again. Use server-sent events/WebSockets only if live seat updates across browsers are needed; polling/refresh is simpler for an initial integration.

## 9. Dynamic UI integration plan

### A. Replace the local adapter

Keep components using one stable interface while introducing a real client, for example:

```js
// src/apiClient.js (future)
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const payload = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || 'Request failed');
  return payload;
}
```

Change the import in `src/App.jsx` from `frontendStore.js` to the API client after the server is ready. During development you may keep an adapter switch (`VITE_DATA_MODE=local|api`) so the UI works without the service. Never silently fallback from failed production API requests to demo records; that can make a failed booking look successful.

### B. Load by route and expose UI states

- Fetch the catalogue for Home/Movies; search and filters may be server-side for large catalogues or client-side for a small already-loaded page.
- For movie booking, load dates/shows for the selected movie and city. Changing the date should request or filter all cinemas and their showtime lists for that date.
- When a show is selected, request its seat map and availability. Refresh availability on return/focus and after reservation conflicts.
- Use explicit `loading`, `data`, `empty`, and `error` states per route. Keep skeletons/placeholders for first load; don’t leave a perpetual spinner if a request fails. Provide retry without forcing a full-page reload.
- Keep requested quantities and current choices in React state. The server response is the source of truth for price, availability, confirmed booking and payment.
- On account changes, clear user-specific cached results and reload bookings; never show one user’s cached private data to another.
- Admin counts, charts, upcoming shows and tables should derive from server responses, not separately maintained frontend counters.
- Preserve accessible labels, keyboard operation, mobile layouts, reduced-motion support, poster fallbacks, and the current transition/POV experience while replacing data calls.

### C. Authentication and authorization

The current local login stores a password digest and role in browser storage solely to demonstrate the screens. For production:

- Store password hashes on the server using Argon2id or bcrypt with an appropriate work factor; never store raw passwords or trust a client-computed digest.
- Prefer secure, `HttpOnly`, `Secure`, `SameSite` session cookies. Protect state-changing cookie-authenticated requests against CSRF.
- Enforce roles and record ownership on every protected backend route. Hiding admin links in React is not authorization.
- Keep admin creation/invitation separate from customer self-registration.
- Avoid placing long-lived access/refresh tokens in `localStorage`.

### D. Payment and ticket QR

Connect a payment provider through server-created payment intents and signed webhooks. The client should display the server’s pending/success/failure state, not create a successful payment row. QR codes should contain an opaque, signed or random high-entropy ticket token; store a hash server-side and validate/check-in it through an authorized endpoint. Do not put personal details or payment data into a QR code.

## 10. Frontend-only checklist

When working before the backend is available:

- Keep behavior in React and `src/frontendStore.js`; do not add server URLs, SQL drivers or backend packages.
- Continue using seeded records only as browser demo fixtures. They can be reset by clearing this app’s localStorage key (`showtimeFrontendDataV1`); local accounts use `showtimeLocalAccounts` and `showtimeDemoAccount`.
- Treat poster/font network failures as asset failures; provide a local placeholder/fallback so the rest of the UI remains usable offline.
- Do not describe local demo login or checkout as secure authentication or real payment.
- Keep API-shaped methods and return values stable where practical so the backend adapter can take over later.

## 11. Suggested integration sequence

1. Agree on field names, enum values, timezone, currency precision, fee/tax policy and cancellation policy.
2. Create database migrations and seed development movies/cinemas/screens/seats/shows.
3. Implement read endpoints first and validate the movie, date, theatre and showtime UI against real data.
4. Implement seat availability and transactional reservations; test simultaneous requests for the same seat.
5. Add sessions, customer-owned bookings, cancellation policy and admin authorization.
6. Add payment intents/webhooks and server-issued QR tickets.
7. Implement admin CRUD and analytics using role-protected endpoints.
8. Replace the local adapter, then test empty/loading/error, expired session, unavailable seat, failed payment, cancellation and retry paths.
9. Deploy API and database separately from the static frontend, configure HTTPS/CORS/session cookies, backups, migrations, monitoring and secrets management.

## 12. Current known boundaries

- Browser `localStorage` is device/browser-specific, editable by the user, has limited capacity and is not concurrency-safe across clients.
- All demo bookings/payments and admin reports are simulated locally and are not business records.
- External poster URLs may change, block hotlinking or disappear; production should use approved/licensed media URLs under a controlled CDN.
- The app is a prototype, not a production ticketing/payment/authentication system.
