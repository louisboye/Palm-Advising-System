# Palm Advising API

Spring Boot 4, Java 25, Spring Security, JPA, PostgreSQL, and Flyway backend foundation. The API implements student email verification, administrator-created adviser invitations, password login, short-lived JWT access tokens, and role-protected self-profile endpoints.

## Requirements

- Java 25 (LTS)
- Docker Desktop with Docker Compose (for local PostgreSQL)
- Network access to Maven Central the first time the Maven wrapper runs
- A static frontend server such as the VS Code Live Server extension, on port 5500

The Maven wrapper is included, so a separate Maven install is not required.

## Local setup (PowerShell)

From the `backend` directory:

```powershell
Copy-Item .env.example .env
```

Replace the example database and administrator passwords in `.env`. Generate a JWT key using PowerShell and paste the printed value as `JWT_SECRET`:

```powershell
$bytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
[Convert]::ToBase64String($bytes)
```

Start PostgreSQL and wait until it is healthy:

```powershell
docker compose up -d postgres
docker compose ps
```

Start the API. The script loads the local `.env` into the process and Flyway applies the database migrations automatically on startup:

```powershell
.\run-local.ps1
```

Check `http://localhost:8080/api/health`. The local profile writes one-time student verification and adviser invitation links to the API log instead of sending email; this is for local development only. Student verification links open the API directly; adviser invitations open a password setup form served by the API. To send email, set `SMTP_HOST` and the SMTP settings in `.env`, set `BACKEND_BASE_URL` to the externally reachable HTTPS API URL, and run with a non-`local` Spring profile. Serve `files/` from a local HTTP server on port 5500; opening the HTML file directly has a `file://` origin that is not enabled for API calls.

Disable `BOOTSTRAP_ADMIN_ENABLED` after confirming the first administrator can sign in. The account remains in the database; turning bootstrap off prevents startup from recreating or changing it.

## Account and access flow

1. A student submits `POST /api/auth/register/student`. The profile remains inactive until its email verification link is used.
2. The student signs in using the verified email and password at `POST /api/auth/login`.
3. An administrator signs in with the provisioned bootstrap account and creates an adviser invitation with `POST /api/admin/advisers`.
4. The adviser sets a password using the emailed invitation link and `POST /api/auth/accept-invitation`.
5. Login returns a 30-minute Bearer token. Send it as `Authorization: Bearer <accessToken>`.
6. `/api/auth/me`, `/api/students/me`, and `/api/advisers/me` return the authenticated account's own profile. The server enforces the role; hiding a UI control is not authorization.

OpenAPI reference: `http://localhost:8080/openapi.yaml`. Health: `http://localhost:8080/actuator/health`.

## Endpoints

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register/student` | Public |
| GET | `/api/auth/verify-email?token=...` | Public, one-time token |
| POST | `/api/auth/accept-invitation` | Public, one-time token |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Any authenticated account |
| GET | `/api/students/me` | Student |
| GET | `/api/advisers/me` | Adviser |
| POST | `/api/admin/advisers` | Administrator |
| GET | `/api/health` | Public |

The `files/` interface offers Student, Adviser, and Administrator sign-in choices. It authenticates against the API, verifies that the account role matches the selected role, restores a short-lived session for the current browser tab, and opens the authenticated account dashboard. Students can register and verify their email; administrators can invite advisers. The synthetic-data demo remains separate from real account access. The API URL defaults to `http://localhost:8080`; serve `files/` over HTTP and start the backend for account actions. To override the API URL, add `<script>window.PALM_API_BASE_URL = "https://your-api-host";</script>` before the `js/api.js` script in `files/index.html`. Student verification and adviser invitation links are sent by the backend.

Run the API and PostgreSQL as described above, then serve `files/` over HTTP (for example, with VS Code Live Server on port 5500). Use the sign-in screen for real accounts. The “Explore the synthetic-data demo” option remains a separate, unauthenticated mock workspace; its adviser/student records and business workflows are not real API data. The real backend currently provides identity and account-profile endpoints only; advising, academic records, assignments, sessions, and reports are not yet implemented.

Use synthetic accounts and grades during development. Do not commit `.env`; production deployments must supply their secrets using a secret manager, use HTTPS, configure SMTP, and set only trusted frontend origins.
