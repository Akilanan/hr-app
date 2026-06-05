# Deploying PeopleHub on the company Windows server

This is the production runbook for running PeopleHub **in-house** on a Windows server,
reachable by staff on the **office network / VPN only** (not the public internet).

## What you get

- **One Windows service** runs the whole app: the Node/Express API *and* the built web
  app are served from a **single port** (the browser talks to a relative `/api`, so there
  is no CORS or second server to manage).
- **SQLite** database stored on the server's own disk — all data stays in the building.
- **Auto-start on boot + auto-restart on crash** via a Windows service.
- **Clean slate:** no demo people. You create the first admin, then add real employees and
  hand each a one-time password they must change at first sign-in.

```
            office LAN / VPN
  staff browsers  ───────────▶  http://peoplehub.company.local:4000
                                      │  (one Node process)
                                      ├── serves the web app (client/dist)
                                      └── /api  →  Express + Prisma  →  SQLite file
```

---

## 0. Prerequisites (on the server)

- **Windows Server** (or an always-on Windows machine) you can administer.
- **Node.js LTS** (v20 or v22): <https://nodejs.org> → verify in PowerShell:
  ```powershell
  node -v
  npm -v
  ```
- The app folder copied to the server, keeping the repo structure intact (so `server\` and
  `client\` stay siblings). Example target: `C:\PeopleHub\app`.
  ```powershell
  git clone <your-repo-url> C:\PeopleHub\app   # or copy the folder over
  ```

---

## 1. Install dependencies and build

```powershell
cd C:\PeopleHub\app
npm install                       # root (concurrently runner)
npm --prefix server install
npm --prefix client install
npm run build                     # builds server\dist and client\dist
```

> Do **not** run `npm run setup` or `npm run seed` — those load demo employees. We want a
> clean database.

---

## 2. Configure the server environment

Create the data folder, then the production `.env`:

```powershell
New-Item -ItemType Directory -Force C:\PeopleHub\data | Out-Null
Copy-Item server\.env.production.example server\.env
```

Generate a strong JWT secret and copy the output:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Open `server\.env` and set:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `file:C:/PeopleHub/data/app.db` (forward slashes; absolute) |
| `JWT_SECRET` | the 96-char hex string you just generated |
| `PORT` | `4000` (or your choice) |
| `NODE_ENV` | `production` |
| `CLIENT_ORIGIN` | the URL staff will type, e.g. `http://peoplehub.company.local:4000` or `http://<server-ip>:4000` |
| `ENABLE_HTTPS` | `false` for plain HTTP on the LAN (set `true` only once HTTPS is in front — see §8) |

---

## 3. Create the (empty) database schema

```powershell
npm --prefix server run db:push
```

This creates `C:\PeopleHub\data\app.db` with all tables and **no data**.

---

## 4. Create the first admin

```powershell
cd C:\PeopleHub\app\server
$env:ADMIN_EMAIL = "you@company.com"
npm run create-admin            # prints a generated one-time password — save it
```

(You can also pass your own password: `$env:ADMIN_PASSWORD = "..."` before running.)
You'll be required to set your own password at first sign-in.

---

## 5. Test it once by hand

```powershell
cd C:\PeopleHub\app\server
node dist\index.js
```

From the **server** browse to `http://localhost:4000` and sign in. From **another PC on the
network**, browse to `http://<server-ip>:4000`. If the other PC can't connect, it's almost
always the firewall (§7). Press `Ctrl+C` to stop, then set up the service.

---

## 6. Run it 24/7 as a Windows service (NSSM)

[NSSM](https://nssm.cc/download) wraps Node as a real Windows service that starts on boot
and restarts on crash. Download `nssm.exe` and put it somewhere like `C:\PeopleHub\nssm.exe`.

```powershell
# Install the service (point it at Node and the built entry file)
C:\PeopleHub\nssm.exe install PeopleHub "C:\Program Files\nodejs\node.exe" "dist\index.js"

# Run from the server folder so it loads server\.env and finds ..\client\dist
C:\PeopleHub\nssm.exe set PeopleHub AppDirectory "C:\PeopleHub\app\server"

# Capture logs to files
New-Item -ItemType Directory -Force C:\PeopleHub\logs | Out-Null
C:\PeopleHub\nssm.exe set PeopleHub AppStdout "C:\PeopleHub\logs\out.log"
C:\PeopleHub\nssm.exe set PeopleHub AppStderr "C:\PeopleHub\logs\err.log"

# Start on boot, restart automatically if it ever exits
C:\PeopleHub\nssm.exe set PeopleHub Start SERVICE_AUTO_START
C:\PeopleHub\nssm.exe set PeopleHub AppExit Default Restart

# Start it now
C:\PeopleHub\nssm.exe start PeopleHub
```

Manage it later with: `nssm restart PeopleHub`, `nssm stop PeopleHub`, or
`Get-Service PeopleHub`. After any code update, rebuild and `nssm restart PeopleHub` (§9).

---

## 7. Open the firewall for the port

```powershell
New-NetFirewallRule -DisplayName "PeopleHub 4000" -Direction Inbound `
  -Action Allow -Protocol TCP -LocalPort 4000 -Profile Domain,Private
```

(Keep it off the `Public` profile so it's only reachable on trusted networks.)

---

## 8. Give the server a stable address

So the URL never changes:

- Assign the server a **static IP** (or a DHCP reservation on your router), and
- Optionally add an internal DNS record like `peoplehub.company.local` → that IP, so staff
  use a friendly name. Put that exact URL in `CLIENT_ORIGIN`.

---

## 8b. (Recommended) HTTPS

Plain HTTP is acceptable on a trusted LAN, but HTTPS is better since login tokens travel the
network. Easiest path: run [Caddy](https://caddyserver.com) on the same server as a reverse
proxy in front of port 4000. Minimal `Caddyfile`:

```
peoplehub.company.local {
    reverse_proxy localhost:4000
}
```

Then set `ENABLE_HTTPS=true` and `CLIENT_ORIGIN=https://peoplehub.company.local` in
`server\.env`, open firewall port 443 instead of 4000, and `nssm restart PeopleHub`.
For a `.local` name you'll use an internal CA or a trusted-on-the-domain certificate.

---

## 9. Daily backups

SQLite is one file; `db:backup` snapshots it (including its WAL sidecar). Schedule it daily:

```powershell
New-Item -ItemType Directory -Force C:\PeopleHub\backups | Out-Null
$action  = New-ScheduledTaskAction -Execute "npm.cmd" -Argument "run db:backup" -WorkingDirectory "C:\PeopleHub\app\server"
$trigger = New-ScheduledTaskTrigger -Daily -At 1:00AM
Register-ScheduledTask -TaskName "PeopleHub backup" -Action $action -Trigger $trigger -RunLevel Highest
```

Set `BACKUP_DIR=C:/PeopleHub/backups` in `server\.env` to control where copies land, and
copy that folder off-server periodically. **To restore:** stop the service, replace
`C:\PeopleHub\data\app.db` with a backup copy, start the service.

---

## 10. Stop the server from sleeping

```powershell
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
```

(On a laptop-as-server also set "do nothing" on lid close in Power Options.)

---

## 11. Adding real people (day-to-day)

1. Sign in as the admin → you're prompted to set your own password.
2. **Employees → Add employee** (or CSV import) to create a person's record.
3. Open their profile → **Create login** → choose a role → it generates a unique one-time
   password. Share it with them securely.
4. They sign in and are **forced to set their own password**. From then on every account has
   its own private password that only that person knows.

Roles: **Admin** (everything, incl. creating logins), **HR** (all people data),
**Manager** (their direct reports), **Employee** (own record + own goals).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Other PCs can't connect | Firewall rule (§7); confirm they use `http://<server-ip>:4000`, server is on. |
| Service won't start | Check `C:\PeopleHub\logs\err.log`. Usually a missing/weak `JWT_SECRET` or bad `CLIENT_ORIGIN` (prod requires both). |
| "Web build not found" in logs | Run `npm run build` so `client\dist` exists, or set `CLIENT_DIST_PATH`. |
| Browser forced to HTTPS but you're on HTTP | `ENABLE_HTTPS` must be `false` for plain HTTP; clear the HSTS entry in the browser. |
| Port already in use | Change `PORT` in `.env` (and the firewall rule), `nssm restart PeopleHub`. |
| Update the app | `git pull` → `npm install` (+ `--prefix server/client`) → `npm run build` → `nssm restart PeopleHub`. |
