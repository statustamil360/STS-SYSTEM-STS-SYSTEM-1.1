# Self-hosted Jitsi Meet on Contabo VPS

This is the install used for AMC Teleconference video at **https://meet.asterixmc.com**.  
STS joins rooms through `JITSI_BASE_URL` (see `server/.env`).

Use a **dedicated Ubuntu 22.04 or 24.04** Contabo VPS (2 GB RAM minimum, 4 GB better). Do not install Jitsi on the same host as aaPanel/Nginx for `team.asterixmc.com` unless you know how to split ports and certificates.

Replace these values if your VPS or domain is different:

| Item | Value used here |
|------|-----------------|
| Domain | `meet.asterixmc.com` |
| STS app URL | `https://team.asterixmc.com` |
| OS | Ubuntu 22.04 or 24.04 LTS |
| Email (Let’s Encrypt) | your admin email |

DNS first: create an **A record** `meet.asterixmc.com` → the Contabo public IPv4. Wait until `ping meet.asterixmc.com` resolves to that IP.

---

## 1. Hostname and packages

```bash
sudo hostnamectl set-hostname meet.asterixmc.com
echo "127.0.1.1 meet.asterixmc.com" | sudo tee -a /etc/hosts

sudo apt update
sudo apt upgrade -y
sudo apt install -y apt-transport-https ca-certificates gnupg2 curl wget nginx-full
sudo add-apt-repository -y universe
```

---

## 2. Firewall (Contabo + UFW)

Open these on the Contabo control panel firewall **and** on the VPS:

| Port | Protocol | Purpose |
|------|----------|---------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP / Let’s Encrypt |
| 443 | TCP | HTTPS (Jitsi web) |
| 10000 | UDP | Jitsi video/audio (videobridge) |
| 3478 | UDP | Fallback STUN |
| 5349 | TCP | Fallback TURN (if enabled) |

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 10000/udp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw enable
sudo ufw status
```

---

## 3. Add the Jitsi repository and install

The `echo ... | sudo tee ...` line **must** write the repo into a file. If you only run `echo` without `| sudo tee`, `apt` will not see Jitsi and you get `Unable to locate package jitsi-meet`.

```bash
curl -sL https://download.jitsi.org/jitsi-key.gpg.key \
  | sudo gpg --dearmor -o /usr/share/keyrings/jitsi-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/" \
  | sudo tee /etc/apt/sources.list.d/jitsi-stable.list

cat /etc/apt/sources.list.d/jitsi-stable.list
```

You should see exactly:

```
deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/
```

Then:

```bash
sudo apt update
apt-cache policy jitsi-meet
sudo apt install -y jitsi-meet
```

`apt update` must list **https://download.jitsi.org**. `apt-cache policy jitsi-meet` must show a Candidate version. If it still says `(none)`, the list file was not created.

When the installer asks:

1. **Hostname of the current installation:** `meet.asterixmc.com`
2. **SSL certificate:** choose **Let's Encrypt certificates** (recommended).  
   Use **Generate a new self-signed certificate** only if DNS or port 80 is not ready yet.

If you pick Let’s Encrypt, enter a real email when asked. DNS for `meet.asterixmc.com` must already point at this VPS, and ports **80/443** must be open.

If you picked self-signed instead, get a public certificate afterwards:

```bash
sudo /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
```

Enter a valid email when asked. After it finishes, open:

https://meet.asterixmc.com

You should see the Jitsi start page.

---

## 4. Allow STS to embed Jitsi (required)

STS loads the meeting inside the app (`JitsiVideoRoom`). The default Jitsi Nginx header blocks that.

Edit the Jitsi site config (name matches your domain):

```bash
sudo nano /etc/nginx/sites-available/meet.asterixmc.com.conf
```

Find `X-Frame-Options` (often `SAMEORIGIN`) and either remove that line or replace it with:

```nginx
add_header X-Frame-Options "" always;
add_header Content-Security-Policy "frame-ancestors https://team.asterixmc.com https://meet.asterixmc.com 'self';" always;
```

If the file uses `add_header Content-Security-Policy` already, add `https://team.asterixmc.com` to `frame-ancestors`.

Reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Optional — keep the Jitsi prejoin page off (STS already skips it):

```bash
sudo nano /etc/jitsi/meet/meet.asterixmc.com-config.js
```

Confirm or add:

```js
config.disableDeepLinking = true;
config.prejoinPageEnabled = false;
config.p2p = { enabled: false };
```

```bash
sudo systemctl restart nginx
```

## . Logo / Watermark remove
### Hide watermark and logo

STS already hides Jitsi branding **inside the app iframe**. To hide it on **https://meet.asterixmc.com** itself (welcome page watermark, corner logo, “powered by”), edit the server files below.

**1. Interface flags**

```bash
sudo nano /usr/share/jitsi-meet/interface_config.js
```

Find these keys and set them (do not duplicate keys — change the existing lines):

```js
APP_NAME: 'AMC Teleconference',
NATIVE_APP_NAME: 'AMC Teleconference',
PROVIDER_NAME: 'AMC',
SHOW_JITSI_WATERMARK: false,
SHOW_WATERMARK_FOR_GUESTS: false,
SHOW_BRAND_WATERMARK: false,
SHOW_POWERED_BY: false,
SHOW_PROMOTIONAL_CLOSE_PAGE: false,
HIDE_DEEP_LINKING_LOGO: true,
DEFAULT_LOGO_URL: '',
DEFAULT_WELCOME_PAGE_LOGO_URL: '',
```

**2. Extra CSS** (covers leftover corner watermarks on newer Jitsi builds)

```bash
sudo nano /usr/share/jitsi-meet/css/all.css
```

Scroll to the **end** of the file and paste:

```css
.leftwatermark,
.rightwatermark,
.watermark,
#watermark,
.welcome .header .header-container .welcome-page-settings,
.welcome .header .welcome-page-button-row img,
div[class*="watermark"] {
    display: none !important;
    background-image: none !important;
    visibility: hidden !important;
}
```

Reload the web server (no videobridge restart needed):

```bash
sudo systemctl reload nginx
```

Then hard-refresh the browser (`Ctrl+Shift+R`) on https://meet.asterixmc.com.

`apt upgrade` of `jitsi-meet` can overwrite `interface_config.js` and `all.css`. After an upgrade, apply these edits again.

---

## 5. Point STS at this Jitsi server

On the **aaPanel / STS** host (`server/.env`):

```env
VIDEO_PROVIDER=jitsi
JITSI_BASE_URL=https://meet.asterixmc.com
```

Then rebuild is not required for `.env` — restart Node:

```bash
sudo -u www pm2 restart sts-system
```

Conference rooms become:

`https://meet.asterixmc.com/<conference-code>`

example: `https://meet.asterixmc.com/con-0014`

---

## 6. Check that services are running

```bash
sudo systemctl status nginx
sudo systemctl status jitsi-videobridge2
sudo systemctl status jicofo
sudo systemctl status prosody
```

All four should be **active (running)**.

Quick logs if a meeting has no audio/video:

```bash
sudo journalctl -u jitsi-videobridge2 -n 80 --no-pager
sudo journalctl -u jicofo -n 80 --no-pager
```

UDP **10000** must be open on Contabo. If the page loads but there is no media, that port is the usual cause.

---

## 7. Test microphone and camera

Use a **Chrome or Edge** browser on HTTPS. Camera and mic will not work on plain HTTP.

### Quick test on the Jitsi site

1. Open https://meet.asterixmc.com
2. Allow **camera** and **microphone** when the browser asks.
3. Enter a room name such as `mic-cam-test` and join.
4. You should see your own video (or an avatar if the camera is off).
5. Click the **microphone** icon — the mute state should toggle. Speak; the mic bar / audio indicator should move.
6. Click the **camera** icon — the picture should turn on and off.
7. Open **Settings** (three dots) → **Virtual backgrounds / Devices** (or **Audio/Video settings**) and confirm the correct mic, speaker, and camera are selected. Use **Test** / play a sound if the menu offers it.

Direct room URL:

https://meet.asterixmc.com/mic-cam-test

### Two-device test (real call)

Join the **same room** from a second device (phone or another PC):

- https://meet.asterixmc.com/mic-cam-test

You should see and hear the other participant. If the page loads but there is **no** remote audio/video, UDP **10000** is blocked on Contabo or UFW.

### Test from STS

On https://team.asterixmc.com, a GP or AHP can also use **Settings → Preferences** (Audio & Video) to test mic, speaker, and camera on that computer, then join a conference. That checks the PC devices; the Jitsi room test above checks the **meet** server path.

### If devices fail

| Symptom | Check |
|---------|--------|
| Browser never asks for camera/mic | Use HTTPS; not HTTP. Try Chrome. |
| Permission denied | Browser site settings for `meet.asterixmc.com` → allow Camera and Microphone |
| Self view works, other person is silent/black | Open UDP **10000** on Contabo firewall + `sudo ufw allow 10000/udp` |
| Black camera in STS only | Confirm `JITSI_BASE_URL=https://meet.asterixmc.com` and iframe headers from section 4 |

On the Jitsi VPS:

```bash
sudo ufw status
sudo journalctl -u jitsi-videobridge2 -n 50 --no-pager
```

---

## 8. Useful commands later

Restart everything after a reboot or config change:

```bash
sudo systemctl restart nginx jitsi-videobridge2 jicofo prosody
```

Renew Let’s Encrypt (timer is normally already enabled):

```bash
sudo certbot renew --dry-run
```

Update Jitsi:

```bash
sudo apt update
sudo apt install --only-upgrade jitsi-meet
```

---




## 9. Typical problems

| Symptom | What to check |
|---------|----------------|
| Browser certificate warning | Let’s Encrypt script did not finish; DNS not pointing at this VPS |
| Jitsi page loads, camera/mic never connect | Contabo firewall / UFW missing **UDP 10000** |
| STS shows a blank meeting frame | `X-Frame-Options` / `frame-ancestors` still blocking `team.asterixmc.com` |
| Wrong host in the app | `JITSI_BASE_URL` on the STS server, then `pm2 restart sts-system` |
| 502 from Nginx | `systemctl status jitsi-videobridge2 jicofo prosody` |

---

## Related

- STS app deploy: [DEPLOYMENT.md](../DEPLOYMENT.md)
- Optional mediasoup/WebRTC fallback (not used when `VIDEO_PROVIDER=jitsi`): [WEBRTC_AAPANEL.md](WEBRTC_AAPANEL.md)





