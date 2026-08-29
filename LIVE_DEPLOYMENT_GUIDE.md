# 🚀 CarbonTrack Live Production Deployment Guide

This guide walks you through deploying **CarbonTrack** live on the web with full real-time database, AI Gemini integration, JWT authentication, and SSL security.

---

## 🌟 Option A: 1-Click Cloud Deployment (Railway / Render - Recommended & Free/Low Cost)

### Step 1: Push Repository to GitHub
Ensure all latest code is committed and pushed to GitHub:
```bash
git add .
git commit -m "Configure production Docker and deployment configs"
git push origin Mouli-authn-logs
```

---

### Step 2: Deploy Backend & Database on Railway (https://railway.app)
1. Go to **Railway.app** and log in with GitHub.
2. Click **New Project** → **Provision MySQL**.
3. Click **+ New** → **GitHub Repo** → Select `carbontrack`.
4. Set the Root Directory to `/backend`.
5. Under **Variables**, add:
   - `SPRING_PROFILES_ACTIVE` = `prod`
   - `DATABASE_URL` = `jdbc:mysql://${MYSQLHOST}:${MYSQLPORT}/${MYSQLDATABASE}?useSSL=true&serverTimezone=UTC`
   - `DB_USERNAME` = `${MYSQLUSER}`
   - `DB_PASSWORD` = `${MYSQLPASSWORD}`
   - `JWT_SECRET` = `carbontrackProductionSecretKeyForJwtSigningMustBeAtLeast256BitsLongForHMACSHA256`
   - `GEMINI_API_KEY` = `your_gemini_api_key`
   - `GOOGLE_CLIENT_ID` = `your_google_client_id`
   - `GOOGLE_CLIENT_SECRET` = `your_google_client_secret`
6. Click **Generate Domain** (e.g. `https://carbontrack-backend.up.railway.app`).

---

### Step 3: Deploy Frontend on Vercel (https://vercel.com) or Netlify
1. Go to **Vercel.com** and click **Add New Project**.
2. Import your `carbontrack` GitHub repository.
3. Set **Framework Preset** to `Vite`.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://carbontrack-backend.up.railway.app`
6. Click **Deploy**. Your live site will be live at `https://carbontrack.vercel.app`!

---

## 🐳 Option B: 1-Click Docker Compose Deployment (DigitalOcean / AWS / Linode / Any VPS)

If you own a Linux VPS (Ubuntu/Debian server):

1. **SSH into your server**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/swathi-r29/carbontrack.git
   cd carbontrack
   ```

3. **Start all services (MySQL + Redis + Backend + Frontend)**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verify running containers**:
   ```bash
   docker ps
   ```
   Your app is now live at `http://your-server-ip`!

---

## 🔒 Post-Deployment Checklist
- [x] Spring Boot Production profile created (`application-prod.properties`)
- [x] Dockerfile & NGINX reverse proxy configured
- [x] Standalone Spring Boot JAR tested (`BUILD SUCCESS`)
- [ ] Add backend Railway domain into Google Cloud Console OAuth Authorized Redirect URIs:
  `https://carbontrack-backend.up.railway.app/login/oauth2/code/google`
