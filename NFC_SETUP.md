# NFC Tag Setup

NFC tags are **pre-saved in the DB** (user does not register tags). User logs in (OTP) → scans NFC → backend validates tag exists in DB and is active → if match, user proceeds.

## Backend Requirements

- **MONGO_URI** in `.env` – MongoDB connection.
- **JWT_SECRET** in `.env` – Secret for JWT (login).
- **ADMIN_SECRET** in `.env` (optional) – Secret for adding tags via admin endpoint.

## Flow

1. **Pre-save tags in DB**
   - Add tags via `POST /api/nfc/admin/add` (Admin-Secret header) or insert directly in MongoDB.
   - Tags have: `tagId` (string, unique), `status` (`active` | `revoked`), timestamps.

2. **User login**
   - User signs in with OTP → gets JWT.

3. **User scans NFC to proceed**
   - App gets `tagId` from scan → calls `POST /api/nfc/verify` with JWT and `{ "tagId": "..." }`.
   - Backend checks: tag exists in DB and `status === 'active'` → returns `{ valid: true }` or `{ valid: false }`.
   - If valid, user proceeds; iOS caches tagId for next time (cache match = no DB call).

## API Summary

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | `/api/nfc/admin/add` | Header `Admin-Secret` | `{ "tagId": "string" }` | Add a tag to DB (pre-save). Requires ADMIN_SECRET. |
| POST | `/api/nfc/verify` | Bearer JWT | `{ "tagId": "string" }` | Validate scanned tag exists in DB and is active. Returns `{ valid: true/false }`. |

## Add a tag to DB

### Option A – Admin API

```bash
curl -X POST http://localhost:3000/api/nfc/admin/add \
  -H "Content-Type: application/json" \
  -H "Admin-Secret: YOUR_ADMIN_SECRET" \
  -d '{"tagId":"your-nfc-tag-id"}'
```

### Option B – Insert directly in MongoDB

The Mongoose model uses collection name `nfctags`. Insert documents with `tagId` and `status`. Mongoose adds `createdAt` and `updatedAt` if you use the model; if you insert raw, you can omit them (the app only checks `tagId` and `status`).

**MongoDB Shell (mongosh):**

```javascript
// Connect to your DB (replace with your connection string or db name)
use timeboxed

// Insert one tag
db.nfctags.insertOne({
  tagId: "nfc-tag-001",
  status: "active"
})

// Insert multiple tags
db.nfctags.insertMany([
  { tagId: "nfc-tag-001", status: "active" },
  { tagId: "nfc-tag-002", status: "active" },
  { tagId: "nfc-tag-003", status: "active" }
])

// Optional: add timestamps (Mongoose would add these automatically)
db.nfctags.insertOne({
  tagId: "nfc-tag-004",
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**One-liner from terminal (mongosh):**

```bash
mongosh "mongodb://localhost:27017/timeboxed" --eval 'db.nfctags.insertOne({ tagId: "nfc-tag-001", status: "active" })'
```

**MongoDB Compass:** Open the `nfctags` collection → Add Data → Insert Document → paste:

```json
{
  "tagId": "nfc-tag-001",
  "status": "active"
}
```

## iOS Usage

- **Check if tag allows proceed:** `AuthenticationManager.shared.isNFCTagValidForUnlock(tagId: scannedTagId)` → first time checks DB and caches; next time matches from cache only.

## MongoDB Schema (NFCTag)

- `tagId` – string, unique
- `status` – `"active"` | `"revoked"`
- `createdAt`, `updatedAt` – timestamps

(No `userId` – tags are global, pre-saved in DB.)
