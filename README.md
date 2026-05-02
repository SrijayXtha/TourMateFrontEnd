# TourMate — Frontend

> Final Year Project · 6CS007 Project & Professionalism  
> BSc (Hons) Computer Science · Herald College Kathmandu (University of Wolverhampton)

A cross-platform mobile app for tourists in Nepal that combines verified guide booking, hotel reservations, and real-time safety tools — all in one platform.

---

## Screenshots

> _Add screenshots of your app screens here once available_

---

## Features

- 🔐 **Authentication** — sign up and login for Tourists, Guides, Hotels, and Admins
- 🔍 **Guide Search & Profiles** — browse verified guides, view ratings, experience, and pricing
- 📅 **Booking Flow** — book guides or hotels separately or as bundled packages
- 🗺 **Interactive Maps** — OpenStreetMap integration for live location, guide meeting points, and incident tagging
- 🚨 **SOS Emergency Button** — one-tap alert with live location sharing
- 📋 **Incident Reporting** — submit reports with photo, description, and location
- 🧳 **Trip Customisation** — select itinerary, destinations, trip length, and activities
- 📊 **Tourist Dashboard** — manage bookings, reports, trips, and emergency contacts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native |
| Language | JavaScript (ES6+) |
| Navigation | React Navigation |
| Maps | OpenStreetMap API |
| API Communication | Axios |
| Authentication | JWT (JSON Web Tokens) |
| State Management | Context API / Redux |
| Version Control | Git + GitHub |
| Project Management | Trello (Agile sprints) |

---

## Project Structure

```
src/
├── components/       # Reusable UI components
├── screens/          # All app screens (auth, booking, dashboard, SOS, etc.)
├── navigation/       # React Navigation stack and tab config
├── hooks/            # Custom React hooks
├── services/         # API call functions (Axios)
└── utils/            # Helper functions
```

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/yourusername/tourmate-frontend.git

# Install dependencies
cd tourmate-frontend
npm install

# Start the app
npx expo start
```

> Requires Node.js and Expo CLI installed. Connect a physical device or use an emulator.

---

## Related

- 🔗 Backend repo: [TourMate Backend](https://github.com/SrijayXtha/TourMateBackend)

---

## Status

🚧 Active development — Final Year Project 2025/26
