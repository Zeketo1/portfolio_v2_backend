---
name: plunk-next-platform
description: This project's Plunk account/keys are on the NEW platform (next-api.useplunk.com), not the legacy api.useplunk.com host
metadata:
  type: project
---

The Plunk account and API keys for this project live on Plunk's **new platform**. Transactional email must be sent to `https://next-api.useplunk.com/v1/send` — NOT the legacy `https://api.useplunk.com/v1/send`. Hitting the old host with a new-platform key returns `401 "Incorrect Bearer token specified"` (misleading — the key is actually valid).

The new API also **requires a `from` sender address** (configured via the `PLUNK_FROM` env var) on a domain verified in the Plunk dashboard. Without it the API returns a 422 validation error. Implemented in src/services/email.service.js.
