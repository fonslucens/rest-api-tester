# Screenshots

Evidence from manual testing in Thunder Client and from the automated test run. These images are shown in the main README.

| File | What it shows |
|---|---|
| `01-signin-token.png` | `POST /auth/signin` → 200 with the JWT token in the response |
| `02-create-with-bearer.png` | `POST /api/projects` with `Bearer {{token}}` → 201 Created |
| `03-no-token-401.png` | `POST /api/projects` without a token → 401 Unauthorized |
| `04-update-put.png` | `PUT /api/projects/:id` → 200 with the updated JSON |
| `05-delete-404.png` | `GET` a deleted project → 404 Not Found |
| `06-collection-run.png` | Thunder Client "Run All": 31 requests, all tests passed |
| `06-collection-run-2.png` | Second half of the same collection run (folders 3–6) |
| `07-npm-test.png` | `npm test`: 43 automated tests passing |
