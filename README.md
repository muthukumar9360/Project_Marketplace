# ProjectVault - Portfolio & Project Marketplace

A full-stack, modern marketplace and portfolio platform designed to showcase GitHub projects, host software for sale, and seamlessly handle payments via UPI with real-time Admin verification.

## Features

- **GitHub Integration:** Automatically fetches and displays public repositories from your GitHub profile.
- **Dynamic Project Gallery:** Autogenerates highly-relevant snapshot images based on project tech stacks.
- **UPI Payments:** Customers can purchase source code via UPI QR code. 
- **Real-Time Admin Verification:** The backend uses Socket.io and Firebase Cloud Messaging (FCM) to send instant push notifications directly to the admin's device when a payment is requested.
- **Admin Dashboard:** A secure dashboard to manage global settings, verify payments, and generate secure time-limited download links for verified customers.
- **Tech Stack:** MERN Stack (MongoDB, Express, React, Node.js) with Tailwind CSS.

## Architecture

This project is organized as a monorepo with two main folders:
- `/client`: The React + Vite frontend application.
- `/server`: The Express + Node.js backend API and Socket server.

## Local Development Setup

### 1. Database & Firebase Setup
- Set up a MongoDB cluster and get the connection URI.
- Create a Firebase project, enable Cloud Messaging, and generate your Web Push VAPID keys.

### 2. Backend (`/server`)
Navigate to the `server` directory and install dependencies:
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=3000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_uri
FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", ...}'
```
Start the server:
```bash
npm start
```

### 3. Frontend (`/client`)
Navigate to the `client` directory and install dependencies:
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_API_URL="http://localhost:3000/api"
VITE_GITHUB_PROFILE="https://github.com/muthukumar9360"
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_auth_domain"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
VITE_FIREBASE_VAPID_KEY="your_vapid_key"
```
Start the frontend:
```bash
npm run dev
```

## Deployment Guide

### Frontend (Netlify)
The frontend is pre-configured to be deployed on **Netlify**.
1. Connect this GitHub repository to your Netlify account.
2. Netlify will automatically detect the `netlify.toml` file in the root directory and build the `/client` folder.
3. Add all your `VITE_` environment variables in the Netlify Dashboard (Site Settings > Environment Variables).

### Backend (Render / Koyeb)
For the backend, you can use a service like **Render** or **Koyeb**.
- Build Command: `npm install`
- Start Command: `npm start`
- Root Directory: `server`
- Remember to add your `MONGODB_URI` and `CLIENT_URL` to the hosting provider's environment variables.

> **Note on Render Sleep Times:** Render's free tier spins down your server after 15 minutes of inactivity, causing the next request to take 30-50 seconds. To prevent this, you can use a free pinging service like **UptimeRobot** to ping your backend URL (`/api/projects`) every 10 minutes to keep it awake!

## License
MIT License
