# Twitch Weekly Recap Website

A full-stack web app that delivers personalized daily recaps of a user’s followed Twitch streamers from the past week.  
The project uses **React, Vite, and Tailwind CSS** for the frontend, and **Node.js with Express** for the backend.

## Features

- **Twitch OAuth Authentication** – Users securely log in with their Twitch account.
- **Automated Data Collection** – Backend service interacts with the Twitch API to gather user-specific data (streams, VODs, and clips).
- **Personalized Recaps** – Aggregates a user’s followed streamers into a curated recap:
  - Highlight reels
  - Top clips
  - Full VODs
- **Interactive Dashboards** – Dynamic frontend pages for browsing recaps.
- **Scalable Design** – Backend fetch logic dynamically adjusts to new Twitch data.

## Pages

1. **Home Page** – Landing page with user authentication and recap overview.  
2. **Dashboard Page** – Displays highlights, top clips, and VODs from the current day.  
4. **Profile Page** – View user profile information such as account age, profile picture, followed steamers, and subcribed channels

Each page leverages reusable React components for rendering lists of streamers, clips, and VODs.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, React Router  
- **Backend:** Node.js, Express  
- **API:** Twitch Helix API  
- **Authentication:** Twitch OAuth  
- **Hosting:** Vercel (frontend), Render (backend)  

## Getting Started

### Prerequisites
- Twitch Developer account for API credentials
- Authorized callback URL within twitch developers account

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/RyanSierra06/Twitch-Weekly-Recap-Website.git
   cd Twitch-Weekly-Recap-Website
2. Install dependencies for both frontend and backend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install

3. Configure environment variables for the frontend:
   ```bash
      FRONTEND_BASE_URL=http://localhost:5173

      NODE_ENV=development

      PORT=4000

      SESSION_SECRET='Your Session Secret'

      TWITCH_CALLBACK_URL=http://localhost:4000/auth/twitch/callback

      TWITCH_CLIENT_ID='Your Twitch Client ID'

      TWITCH_SECRET='Your Twitch Secret'
4. Configure environment variables for the backend:
   ```bash
      VITE_BACKEND_BASE_URL=http://localhost:4000
5. Run the backend server:
   ```bash
      cd backend
      node index.js
6. Run the frontend:
   ```bash
      cd frontend
      npm run dev
7. Your frontend and backend will be available at http://localhost:5173 and http://localhost:4000 respectively


<img width="1301" height="854" alt="Twitch-Website-1" src="https://github.com/user-attachments/assets/e0cf94e8-6a11-4e36-97e0-4b77456bc348" />
<img width="1271" height="851" alt="Twitch-Website-2" src="https://github.com/user-attachments/assets/0051303f-1661-40b1-ac04-53a486821c60" />
<img width="1258" height="853" alt="Twitch-Website-3" src="https://github.com/user-attachments/assets/f899196c-d6eb-4cac-849a-72fadb8e4e6c" />
<img width="1253" height="857" alt="Twitch-Website-4" src="https://github.com/user-attachments/assets/65c762b0-d491-4318-92c7-d32baf5e2047" />


