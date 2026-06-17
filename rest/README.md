# REST request files

Ready-to-run HTTP requests for every endpoint in this API.

## Setup

1. Install the VS Code extension **REST Client** (`humao.rest-client`).
2. Start the server: `npm run dev` (runs on `http://localhost:3000`).
3. Open any `.rest` file and click the **"Send Request"** link that appears above each request.

## Files

| File | Endpoints |
|------|-----------|
| [auth.rest](auth.rest) | `POST /api/auth/login`, `POST /api/auth/verify-otp` |
| [projects.rest](projects.rest) | `GET/POST/PUT/DELETE /api/projects` |
| [upload.rest](upload.rest) | `POST /api/upload` |

## Typical end-to-end flow

1. **Log in** — `auth.rest` → "Request an OTP". The OTP is emailed (or printed to the
   server console in dev mode).
2. **Verify** — `auth.rest` → "Verify the OTP". Copy the `token` from the response.
3. **Upload an image** — `upload.rest`. Put an image at `rest/sample.jpg` first.
   Copy the returned `url`.
4. **Create a project** — `projects.rest`. Paste the JWT into `@token` and the image
   `url` into the `image` field, then send.

## Notes

- Edit the `@baseUrl`, `@adminEmail`, `@token`, and `@projectId` variables at the top of
  each file to match your environment.
- The upload field name must be `file`.
- GET project routes are public; write routes use the JWT if auth is enabled on them.
