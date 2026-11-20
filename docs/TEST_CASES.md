# Test Cases

Every test case below is automated in [`tests/`](../tests) and runs with `npm test`.
The same flow can be run by hand with the Thunder Client collection in [`api-collection/`](../api-collection).

**Last run:** 43 / 43 passed (`npm test`), 31 requests / 60 assertions passed (collection run).

Legend: 🔓 no token 🔒 Bearer token

---

## 1. Sign up — `POST /api/users`

| ID | Scenario | Request | Expected | Result |
|---|---|---|---|---|
| TC-AUTH-01 | Create a new user | 🔓 `{ name, email, password }` | `201`, JSON has `user._id`, `user.email`; **no** `hashed_password` / `salt` | ✅ Pass |
| TC-AUTH-02 | Same email twice | 🔓 same body again | `409`, `{ error: "Email already exists" }` | ✅ Pass |
| TC-AUTH-03 | Invalid input | 🔓 password `"123"` / email `"not-an-email"` | `400` with the validation message | ✅ Pass |

## 2. Sign in — `POST /auth/signin`

| ID | Scenario | Request | Expected | Result |
|---|---|---|---|---|
| TC-AUTH-04 | Correct email + password | 🔓 `{ email, password }` | `200`, `token` is a JWT (3 parts), token payload `_id` = user id | ✅ Pass |
| TC-AUTH-05 | Wrong password | 🔓 wrong password | `401`, no token in response | ✅ Pass |
| TC-AUTH-06 | Missing password | 🔓 `{ email }` only | `400` | ✅ Pass |

## 3. Bearer token on protected routes

| ID | Scenario | Request | Expected | Result |
|---|---|---|---|---|
| TC-AUTH-07 | No `Authorization` header | `POST /api/projects` | `401`, `"A valid Bearer token is required"` | ✅ Pass |
| TC-AUTH-08 | Malformed token | `Bearer not.a.real.token` | `401` | ✅ Pass |
| TC-AUTH-09 | Expired token | token with `exp` in the past | `401` | ✅ Pass |
| TC-AUTH-10 | Token signed with another secret | forged token | `401` | ✅ Pass |
| TC-AUTH-11 | Valid token | 🔒 | `201` | ✅ Pass |
| TC-AUTH-12 | Sign out | `GET /auth/signout` | `200`, cookie `t` cleared | ✅ Pass |

## 4. Users — `/api/users/:userId`

| ID | Scenario | Request | Expected | Result |
|---|---|---|---|---|
| TC-USR-01 | List users | 🔓 `GET /api/users` | `200`, array, only `name/email/created/updated` | ✅ Pass |
| TC-USR-02 | Read one user | 🔒 `GET` | `200`, no `salt` in response | ✅ Pass |
| TC-USR-03 | Update own profile | 🔒 `PUT { name }` | `200`, change saved (checked with a second `GET`) | ✅ Pass |
| TC-USR-04 | Update another user's profile | 🔒 other user's token | `403`, `"User is not authorized"` | ✅ Pass |
| TC-USR-05 | Change password | 🔒 `PUT { password }` | old password → `401`, new password → `200` | ✅ Pass |
| TC-USR-06 | Delete own account | 🔒 `DELETE` | `200`; the same token afterwards → `401` | ✅ Pass |

## 5. CRUD — contacts, projects, qualifications

The same checklist runs on all three resources (`CONT`, `PROJ`, `QUAL`).

| ID | Scenario | Request | Expected | Result |
|---|---|---|---|---|
| TC-xxxx-01 | Full CRUD cycle | `POST` → `GET` list → `GET` one → `PUT` → `DELETE` → `GET` | `201` → `200` → `200` → `200` → `200` → `404` | ✅ Pass ×3 |
| TC-xxxx-02 | Update / delete without token | 🔓 `PUT`, `DELETE` | `401`, `401` | ✅ Pass ×3 |
| TC-xxxx-03 | Empty body | `POST {}` | `400` with an `error` message | ✅ Pass ×3 |
| TC-xxxx-04 | Extra field `isAdmin: true` | `POST` | `201`, `isAdmin` **not** saved | ✅ Pass ×3 |
| TC-PROJ/QUAL-05 | Create without token | 🔓 `POST` | `401` (contacts allow public `POST`) | ✅ Pass ×2 |
| TC-PROJ/QUAL-06 | Invalid date | `completion: "not-a-date"` | `400` | ✅ Pass ×2 |

## 6. Error handling

| ID | Scenario | Request | Expected | Result |
|---|---|---|---|---|
| TC-ERR-01 | API is running | `GET /` | `200`, welcome message | ✅ Pass |
| TC-ERR-02 | Unknown route | `GET /api/does-not-exist` | `404`, JSON `{ error }` | ✅ Pass |
| TC-ERR-03 | Broken JSON | body `{"firstname": "Ada",` | `400`, `"Invalid JSON request body"` | ✅ Pass |
| TC-ERR-04 | Badly formatted id | `GET /api/projects/12345` | `400`, `"Invalid project ID"` | ✅ Pass |
| TC-ERR-05 | Valid id that does not exist | `GET /api/projects/64b7…718` | `404`, `"Project not found"` | ✅ Pass |
| TC-ERR-06 | Security headers | `GET /` | `X-Content-Type-Options: nosniff`, no `X-Powered-By` | ✅ Pass |
| TC-ERR-07 | Bulk delete without confirm header | 🔒 `DELETE /api/contacts` | `400`, nothing deleted | ✅ Pass |
| TC-ERR-08 | Bulk delete with confirm header | 🔒 + `X-Confirm-Delete-All: DELETE ALL` | `200`, `deletedCount: 2` | ✅ Pass |
| TC-ERR-09 | Bulk delete turned off | `ALLOW_BULK_DELETE=false` | `403` | ✅ Pass |

---

## Status codes covered

| Code | Meaning | Where it is tested |
|---|---|---|
| `200 OK` | Read / update / delete worked | GET, PUT, DELETE, sign in |
| `201 Created` | New document saved | POST users, contacts, projects, qualifications |
| `400 Bad Request` | Invalid JSON, invalid id, failed validation, empty body | AUTH-03/06, ERR-03/04/07, CRUD-03/06 |
| `401 Unauthorized` | Missing, invalid, expired or forged token; wrong password | AUTH-05/07–10, USR-06, CRUD-02/05 |
| `403 Forbidden` | Valid token but not allowed | USR-04, ERR-09 |
| `404 Not Found` | Unknown route or deleted document | ERR-02/05, CRUD-01 |
| `409 Conflict` | Duplicate email | AUTH-02 |
