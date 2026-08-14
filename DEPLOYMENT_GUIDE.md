# Healthcare Management System — Render Deployment Guide

This guide walks you through deploying the full-stack Healthcare & Clinic Management System on [Render](https://render.com).

---

## 🛠 Deployment Options on Render

### Option 1: Automatic Blueprint Deployment (Recommended)

1. **Push updates to GitHub**:
   ```bash
   git add render.yaml
   git commit -m "Add Render Blueprint configuration"
   git push origin main
   ```
2. Go to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository (`ARAVINDKUMARGS/internsAravind_INBT015533_iNeuBytes`).
5. Render will automatically read `render.yaml` and set up the Web Service, Environment Variables, and Start Commands.
6. Click **Apply**. Render will build and deploy your app.

---

### Option 2: Manual Web Service Creation on Render

If you prefer to configure the Web Service manually:

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your repository: `https://github.com/ARAVINDKUMARGS/internsAravind_INBT015533_iNeuBytes`.
4. Configure the service settings:
   - **Name**: `healthcare-management-system`
   - **Root Directory**: `healthcare-management-system/backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add **Environment Variables**:
   - `PORT`: `10000`
   - `RENDER`: `true`
   - `JWT_SECRET`: *(Enter a secure secret key)*
   - `JWT_EXPIRES_IN`: `7d`
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `587`
   - `EMAIL_USER`: `aravindkumar06062006@gmail.com`
   - `EMAIL_PASS`: `htvnkadxyynesvda`
   - `EMAIL_FROM`: `"Wellframe Clinic" <aravindkumar06062006@gmail.com>`
6. Click **Create Web Service**.

---

## 🚀 Post-Deployment Verification

Once deployed, Render will generate a live URL (e.g. `https://healthcare-management-system.onrender.com`).

- **Landing Page**: Access `https://<your-render-app>.onrender.com` directly in your browser.
- **Auto-Database Seeding**: The app automatically creates and seeds SQLite tables on first startup with demo accounts:
  - **Admin**: `admin@clinic.com` / `Admin@123`
  - **Doctor**: `ananya.rao@clinic.com` / `Doctor@123`
  - **Patient**: `patient@demo.com` / `Patient@123`
