# Deploying chatmessage

Spring Boot 3 / Java 17 app + MySQL. WebSocket (SockJS/STOMP) is served from the same host as the UI.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DB_USERNAME`, `DB_PASSWORD` | yes | App fails fast at startup if missing |
| `DB_URL` | one of | Full JDBC URL, e.g. `jdbc:mysql://host:3306/chatapp?sslMode=REQUIRED&serverTimezone=UTC` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | one of | Used when `DB_URL` is not set (defaults: localhost / 3306 / chatapp) |
| `DB_SSL_MODE` | no | `PREFERRED` (default), `REQUIRED`, `DISABLED` |
| `COOKIE_SECURE` | no | Default `true`. Must be `true` behind HTTPS; use `false` only for plain-http testing |
| `ALLOWED_ORIGINS` | no | Comma-separated WebSocket origins. Empty = same-origin only |
| `DDL_AUTO` | no | Default `update` (creates tables on first run). Use `validate` later |
| `PORT` | no | Default 8080; most platforms set this for you |

Health check endpoint: `GET /health`

## Run locally
You must activate the `local` profile (it carries the localhost MySQL settings from
`src/main/resources/application-local.properties`; edit the username/password there if yours differ).
Create the database first: `CREATE DATABASE chatapp;`

- Maven: `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`
- Eclipse/STS: Run Configurations -> your Spring Boot app -> Arguments -> Program arguments: `--spring.profiles.active=local`
  (or Environment tab -> add `SPRING_PROFILES_ACTIVE` = `local`)
- IntelliJ: Run configuration -> Active profiles: `local`

Without the profile (or DB_USERNAME/DB_PASSWORD env vars) the app stops at startup with a message saying so.

## Docker / docker-compose
```
cp .env.example .env     # edit passwords
docker compose up -d --build
# open http://localhost:8080
```

## Hosting platforms (Render, Railway, Fly.io, etc.)
1. Create a managed MySQL instance (or use a MySQL add-on) and note host/user/password.
2. Create a web service from the repo using the included `Dockerfile` (or Build: `mvn -DskipTests clean package`, Start: `java -jar target/*.jar`).
3. Set the env vars above (at minimum `DB_URL` or `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`).
4. Health check path: `/health`. Serve over HTTPS and keep `COOKIE_SECURE=true`.

## Limitations
- Sessions and the STOMP message broker are in-memory: run **one instance**. Restarts log users out.
  Scaling out needs Spring Session (Redis/JDBC) and an external broker.
- No login rate limiting yet; put the app behind a platform/WAF rate limit if exposed publicly.
