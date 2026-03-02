# 🦉 FocusFlow (Student SaaS)

![FocusFlow Banner](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop)

> A minimalist, high-performance study platform designed to keep students in the zone.

FocusFlow is a real-time collaborative study application built to help students manage their time, tasks, and stay motivated through virtual study rooms. Designed with a sleek, minimalist aesthetic, it combines productivity tools with social accountability.

## ✨ Features

- **🎯 Interactive Study Rooms**: Join or create custom study rooms with real-time presence.
- **💬 Live Chat**: Seamless, ephemeral live chat to communicate with your study group without losing focus.
- **📝 Shared Tasks**: Collaborate on real-time checklists that sync instantly across all room members.
- **⏱️ Focus Timer**: Built-in Pomodoro/Focus timers with status syncing (Idle, Focusing, Done).
- **🎨 Shared Whiteboard**: Brainstorm and collaborate visually with a built-in whiteboard right in your study room.
- **🎧 Zen Mode**: Get into the flow state with curated lo-fi/focus tracks and "bizarre" visual archetypes.
- **🔔 Interactive Nudges**: Send ephemeral nudges to keep your friends accountable.
- **📱 Fully Responsive**: A beautiful, glassmorphism-inspired UI that works flawlessly on desktop, tablet, and mobile (featuring a slide-up task drawer and prioritized chat).

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Vanilla CSS + Glassmorphism UIs
- **Backend & Realtime Data**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Drag & Drop**: `@dnd-kit`
- **Charts/Metrics**: `recharts`

## 🚀 Quick Start

1. **Clone the repository:**

   ```bash
   git clone https://github.com/abhinaycoding/focusflow.git
   cd "Student saas"
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Firebase Environment Variables:**
   Create a `.env` file in the root directory and add your Firebase config:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check [issues page](https://github.com/abhinaycoding/focusflow/issues).

## 📝 License

This project is licensed under the MIT License.
