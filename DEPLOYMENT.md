# AMC Teleconference System — Deployment Guide

This guide covers deploying to a **VPS / cloud server** (Windows or Linux) with **MySQL** and a **single Node.js process** serving both API and frontend.

---

## Architecture (production)

```
Browser  →  https://your-domain.com
              ├── /          → React app (client/dist)
              ├── /api/*     → Express API
              └── /uploads/* → Profile & appointment files
                    ↓
              MySQL (amc_teleconference)
```

Optional: **private WebRTC** (mediasoup + coturn on your VPS). See [docs/WEBRTC_AAPANEL.md](docs/WEBRTC_AAPANEL.md). Jitsi and Daily.co are no longer used.

---

## 1. Server requirements

| Item | Minimum |
|------|---------|
| OS | Windows Server or Linux (Ubuntu 22.04 recommended) |
| Node.js | **18+** |
| MySQL | **8.0+** or MariaDB 10.6+ |
| RAM | 1 GB+ |
| Ports | **80/443** (public), **5000** (internal, optional) |

---

## 2. Upload project to server

Copy the project folder (or clone from Git) to the server, e.g.:

```
/var/www/amc-teleconference   (Linux)
C:\inetpub\amc-teleconference (Windows)
```

Do **not** commit or upload `server/.env` — create it on the server.

---

## 3. Install dependencies & build

```bash
cd /path/to/amc-teleconference
npm install
npm run build
```

Or in one step:

```bash
npm run deploy:prepare
```

**Cloud deploy:** use **Build command** `npm run build` and **Start command** `npm start`.  
Root `postinstall` installs `client/` and `server/` dependencies automatically; `build` also installs client deps before Vite runs.

---

## 4. Configure environment

### Backend — `server/.env`

Copy from example and edit:

```bash
cp server/.env.example server/.env
```

**Production example:**

```env
PORT=5000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_USER=amc_user
DB_PASSWORD=STRONG_DB_PASSWORD
DB_NAME=amc_teleconference

JWT_SECRET=CHANGE_TO_LONG_RANDOM_STRING_32_CHARS_MIN
JWT_REFRESH_SECRET=CHANGE_TO_ANOTHER_LONG_RANDOM_STRING
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

UPLOAD_DIR=uploads
CLIENT_URL=https://your-domain.com

# Private WebRTC (mediasoup + coturn on VPS)
WEBRTC_LISTEN_IP=0.0.0.0
WEBRTC_ANNOUNCED_IP=YOUR_PUBLIC_VPS_IP
STUN_URLS=stun:turn.yourdomain.com:3478
TURN_URL=turn:turn.yourdomain.com:3478
TURN_SECRET=YOUR_COTURN_SECRET
MEDIASOUP_MIN_PORT=40000
MEDIASOUP_MAX_PORT=49999
```

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | Must be `production` |
| `CLIENT_URL` | Public URL users open in browser (HTTPS recommended) |
| `JWT_*` | Generate unique secrets — never use demo values |
| `DB_*` | Create dedicated MySQL user (not `root` in production) |

### Frontend — built automatically

Production build uses `client/.env.production`:

```
VITE_API_URL=/api
```

No separate frontend server is needed when using the bundled Express static hosting.

---

## 5. Database setup

```bash
# Create database & user in MySQL (example)
mysql -u root -p
```

```sql
CREATE DATABASE amc_teleconference CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'amc_user'@'localhost' IDENTIFIED BY 'STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON amc_teleconference.* TO 'amc_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Run migrations and seed:

```bash
npm run seed
npm run migrate:conference
npm run migrate:timeout
```

For production, **change all demo passwords** after first login or create new admin accounts and disable demo users.

---

## 6. Start the application

### Option A — Direct start

```bash
npm run start:prod
```

App listens on `PORT` (default **5000**).

### Option B — PM2 (recommended for Linux VPS)

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Ensure `server/.env` exists; PM2 loads env from the shell or use `env_file` in ecosystem config.

### Verify

```bash
curl http://localhost:5000/api/health
```

Open in browser (via reverse proxy): `https://your-domain.com`

---

## 7. Reverse proxy (HTTPS)

Expose the app on **443** using **Nginx** (Linux example):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Use **Certbot** for free SSL: `certbot --nginx -d your-domain.com`

Set `CLIENT_URL=https://your-domain.com` in `server/.env` and restart the app.

---

## 8. Windows IIS / XAMPP notes

- **XAMPP**: Start MySQL from XAMPP Control Panel; use `DB_HOST=localhost`, `DB_PASSWORD=` if root has no password (dev only).
- **Production Windows**: Prefer running Node with PM2 for Windows or as a Windows Service; put **IIS** or **nginx for Windows** in front for HTTPS.

---

## 9. Post-deploy checklist

- [ ] `NODE_ENV=production` in `server/.env`
- [ ] Strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Demo passwords changed
- [ ] `CLIENT_URL` matches public HTTPS URL
- [ ] `npm run build` completed — `client/dist/` exists
- [ ] MySQL seeded + migrations applied
- [ ] `/api/health` returns success
- [ ] Login works at `/login`
- [ ] File uploads work (`/uploads` writable — folder `server/uploads`)
- [ ] Video conference tested (GP accept → join)

---

## 10. Updating after code changes

```bash
git pull
npm run deploy:prepare
pm2 restart amc-teleconference
# or restart npm run start:prod
```

Run new migrations if added:

```bash
npm run migrate:conference
npm run migrate:timeout
```

---

## 11. Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page after deploy | Run `npm run build`; check `client/dist/index.html` exists |
| API 404 / CORS errors | Set `CLIENT_URL` to exact browser URL; rebuild with `VITE_API_URL=/api` |
| Database connection failed | Check MySQL running, `.env` credentials, firewall |
| 502 Bad Gateway | Node not running on PORT; check `pm2 logs` |
| Uploads missing | Ensure `server/uploads` exists and is writable |
| Video not working | See [docs/WEBRTC_AAPANEL.md](docs/WEBRTC_AAPANEL.md): open UDP 40000–49999, configure coturn, set `WEBRTC_ANNOUNCED_IP`, allow camera/mic |

---

## Quick command reference

```bash
npm run deploy:prepare    # install + build
npm run start:prod        # production server
npm run seed              # database seed
npm run migrate:conference
npm run migrate:timeout
pm2 start ecosystem.config.cjs
pm2 logs amc-teleconference
```
