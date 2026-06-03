# Admin & super admin setup (starter)

The mobile app **does not yet have** an admin screen. Until that is built, use Snowflake or the scripts below.

## What the app expects

| Field | Value for login |
|--------|------------------|
| `FARM_USERS.STATUS` | `ACTIVE` (not `PREAPPROVED`) |
| `USER_SHED_ASSIGNMENT.ROLE_ID` | e.g. `SUPERADMIN`, `ADMIN`, `SUPERVISOR` |
| Login flow | Email/phone + password → OTP → Home |

`SUPERADMIN` / `ADMIN` / `INCHARGE` can access all sheds (see `backend/middleware/auth.js`).

---

## Option A — Script (recommended)

From the `backend` folder, with Snowflake `.env` configured and server key in place:

```bash
node scripts/createSuperAdmin.js \
  --email admin@merlafarms.com \
  --password "YourSecurePass123" \
  --userid superadmin_01
```

Then log in on the app with that email/password. With `OTP_BYPASS=true`, use OTP `123456`.

### Approve a signed-up user

```bash
node scripts/approveUser.js --userid john_4297 --role SUPERVISOR --shed "YOUR_SHED_NAME"
```

Find pending users:

```sql
SELECT USERID, USER_EMAIL, USER_CONTACT_NO, STATUS, USER_FIRSTNAME
FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS
WHERE STATUS = 'PREAPPROVED';
```

Pick a shed from:

```sql
SELECT SHED_NO, SHED_NAME
FROM MERLAFARMS.MASTER.SHED_MASTER
WHERE FARM_NAME = 'MERLA FARMS';
```

---

## Option B — Snowflake worksheet only

### 1) Create super admin (if SP exists)

```sql
-- Hash password in Node first, or use script above.
CALL MERLAFARMS.APP_TRANSACTION.SP_CREATE_FARM_USER_SQL(
  'MERLA_FARMS',           -- farm
  'superadmin_01',         -- userid
  'Super', 'Admin',        -- first, last
  '2000-01-01',            -- dob
  'admin@merlafarms.com',  -- email
  '9999999999',            -- phone
  '<bcrypt_hash_here>',    -- password_hash
  'BOOTSTRAP_ADMIN',       -- gov_id
  'ACTIVE'                 -- status (must be ACTIVE to login)
);

CALL MERLAFARMS.APP_TRANSACTION.SP_UPDATE_USER_STATUS_AND_ASSIGN(
  'superadmin_01',
  'ACTIVE',
  'SUPERADMIN',
  NULL   -- or a shed name; SUPERADMIN often has all sheds
);
```

### 2) Approve a user who signed up in the app

```sql
CALL MERLAFARMS.APP_TRANSACTION.SP_UPDATE_USER_STATUS_AND_ASSIGN(
  '<their_USERID>',
  'ACTIVE',
  'SUPERVISOR',      -- or USER / ADMIN per your model
  '<SHED_NAME>'      -- from SHED_MASTER
);
```

### 3) Verify

```sql
SELECT FU.USERID, FU.USER_EMAIL, FU.STATUS, USA.ROLE_ID, USA.SHED_NAME
FROM MERLAFARMS.APP_TRANSACTION.FARM_USERS FU
LEFT JOIN MERLAFARMS.APP_TRANSACTION.USER_SHED_ASSIGNMENT USA
  ON FU.USERID = USA.USERID
  AND USA.ASSIGNMENT_END_DATE >= CURRENT_DATE
WHERE FU.USERID = 'superadmin_01';
```

---

## If `SP_UPDATE_USER_STATUS_AND_ASSIGN` fails

Confirm the procedure signature in Snowflake:

```sql
DESC PROCEDURE MERLAFARMS.APP_TRANSACTION.SP_UPDATE_USER_STATUS_AND_ASSIGN;
```

Parameter order may differ from the script — update `scripts/createSuperAdmin.js` and `approveUser.js` to match.

---

## Next step in the app (not built yet)

To approve users from the phone you will need:

- API: list `PREAPPROVED` users (SUPERADMIN only)
- API: call `SP_UPDATE_USER_STATUS_AND_ASSIGN`
- Screen: Admin → pending list → Approve (role + shed)
