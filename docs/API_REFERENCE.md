# API Reference

Base URL (local): `http://localhost:3000`
All request and response bodies are JSON. Protected routes need this header:

```
Authorization: Bearer <token from POST /auth/signin>
```

🔓 = public  🔒 = Bearer token required  👤 = token must belong to the same user

## Auth

| Method | Endpoint | Access | Body | Success | Errors |
|---|---|---|---|---|---|
| POST | `/auth/signin` | 🔓 | `{ email, password }` | `200` `{ token, user }` | `400` missing fields, `401` wrong email/password |
| GET | `/auth/signout` | 🔓 | – | `200` `{ message: "signed out" }` | – |

## Users

| Method | Endpoint | Access | Body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/users` | 🔓 | – | `200` array of `{ _id, name, email, created, updated }` | – |
| POST | `/api/users` | 🔓 | `{ name, email, password }` | `201` `{ message, user }` | `400` validation, `409` email already exists |
| GET | `/api/users/:userId` | 🔒 | – | `200` user | `400` bad id, `401`, `404` |
| PUT | `/api/users/:userId` | 🔒 👤 | any of `{ name, email, password }` | `200` updated user | `400`, `401`, `403` other user, `409` |
| DELETE | `/api/users/:userId` | 🔒 👤 | – | `200` `{ message, _id }` | `401`, `403`, `404` |

## Projects, Qualifications, Contacts

The three resources follow the same pattern. Replace `<resource>` with `projects`, `qualifications` or `contacts`.

| Method | Endpoint | Access | Success | Errors |
|---|---|---|---|---|
| GET | `/api/<resource>` | 🔓 | `200` array | – |
| POST | `/api/<resource>` | 🔒 (contacts: 🔓) | `201` created document | `400` empty body / invalid value, `401` |
| GET | `/api/<resource>/:id` | 🔓 | `200` document | `400` bad id, `404` not found |
| PUT | `/api/<resource>/:id` | 🔒 | `200` updated document | `400`, `401`, `404` |
| DELETE | `/api/<resource>/:id` | 🔒 | `200` `{ message, _id }` | `401`, `404` |
| DELETE | `/api/<resource>` | 🔒 + guard | `200` `{ message, deletedCount }` | `400` missing confirm header, `401`, `403` disabled |

**Fields**

| Resource | Fields |
|---|---|
| projects / qualifications | `title`, `firstname`, `lastname`, `email`, `completion` (date), `description` |
| contacts | `firstname`, `lastname`, `email` |

Unknown fields in a request body are ignored (the server copies only the allowed fields).

## Bulk delete guard

Deleting a whole collection is disabled by default. It only works when:

1. `NODE_ENV=development` and `ALLOW_BULK_DELETE=true` in `.env`
2. the request has a valid Bearer token
3. the request has the header `X-Confirm-Delete-All: DELETE ALL`

## Error format

Every error returns JSON in the same shape:

```json
{ "error": "A valid Bearer token is required" }
```
