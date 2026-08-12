# Private WebRTC on Ubuntu / aaPanel

This project uses **company-owned video**: **mediasoup** (SFU) in Node.js plus **coturn** (STUN/TURN) on the same VPS. No Jitsi or Daily.co.

Supports **GP + multiple AHPs + guest logins** in one conference room.

---

## Architecture

```
Browser (GP / AHP / guest)
    │  HTTPS + WSS (/socket.io)
    ▼
Nginx (aaPanel) → Node.js (Express + Socket.IO + mediasoup)
    │                      │
    │                      └── UDP 40000–49999 (mediasoup media)
    ▼
coturn (3478 + relay UDP 49152–65535)
```

---

## 1. Firewall (aaPanel / ufw)

Open these ports on the VPS:

| Port | Protocol | Purpose |
|------|----------|---------|
| 80, 443 | TCP | Web app (aaPanel Nginx) |
| 3478 | UDP + TCP | STUN/TURN (coturn) |
| 40000–49999 | UDP | mediasoup WebRTC media |
| 49152–65535 | UDP | TURN relay (coturn default) |

In aaPanel: **Security** → add rules, or via SSH:

```bash
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 40000:49999/udp
sudo ufw allow 49152:65535/udp
```

---

## 2. Install coturn (SSH)

```bash
sudo apt update
sudo apt install -y coturn
sudo nano /etc/turnserver.conf
```

**Example `/etc/turnserver.conf`:**

```ini
listening-port=3478
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=YOUR_LONG_RANDOM_SECRET
realm=turn.yourdomain.com
server-name=turn.yourdomain.com
listening-ip=0.0.0.0
relay-ip=YOUR_PUBLIC_VPS_IP
external-ip=YOUR_PUBLIC_VPS_IP
min-port=49152
max-port=65535
no-cli
no-tls
no-dtls
log-file=/var/log/turnserver.log
```

Enable and start:

```bash
sudo sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn
sudo systemctl enable coturn
sudo systemctl restart coturn
sudo systemctl status coturn
```

Optional DNS: create `turn.yourdomain.com` A record → VPS IP (aaPanel DNS or your registrar).

---

## 3. Node.js `.env` (server)

On production, set your **public VPS IP** for WebRTC:

```env
WEBRTC_LISTEN_IP=0.0.0.0
WEBRTC_ANNOUNCED_IP=YOUR_PUBLIC_VPS_IP

STUN_URLS=stun:turn.yourdomain.com:3478
TURN_URL=turn:turn.yourdomain.com:3478
TURN_SECRET=YOUR_LONG_RANDOM_SECRET

MEDIASOUP_MIN_PORT=40000
MEDIASOUP_MAX_PORT=49999
```

`TURN_SECRET` must match `static-auth-secret` in coturn. The app generates time-limited TURN credentials automatically.

---

## 4. Nginx WebSocket (aaPanel)

Socket.IO signaling must proxy WebSockets. In your site Nginx config:

```nginx
location /socket.io/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}
```

Reload Nginx after saving.

---

## 5. Deploy app

```bash
cd /www/wwwroot/your-site
npm install
npm run build
# Restart Node app in aaPanel (PM2 / Node project)
```

On first start, logs should show:

```
[mediasoup] Worker started (ports 40000-49999)
```

---

## 6. Test multi-party

1. GP accepts and joins a conference.
2. Two AHP accounts join the same conference.
3. Optional: create a **guest login** and join as external participant.
4. Confirm all video tiles appear and audio is two-way.

If video works on LAN but not over internet:

- Check `WEBRTC_ANNOUNCED_IP` matches public IP.
- Confirm UDP 40000–49999 and coturn ports are open.
- Verify TURN: browser devtools → WebRTC internals → look for `relay` ICE candidates.

---

## 7. Local development

Without coturn, STUN-only may work on the same network. For realistic testing, run coturn on the dev machine or point `STUN_URLS` / `TURN_URL` at your VPS turn server.

---

## Removed dependencies

- `@daily-co/daily-js` (client)
- `DAILY_API_KEY`, `DAILY_DOMAIN` (server)
- Jitsi iframe (`meet.jit.si`)

All clinical video now runs through your own infrastructure.
