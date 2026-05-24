# 💡 WTF Insights

> **"The sharpest quotes, frameworks, and takeaways from the *WTF is* Podcast by Nikhil Kamath — distilled for people who'd rather think than scroll."**

WTF Insights is a premium web application that compiles, categorizes, and organizes knowledge shared on the popular *WTF is* podcast. Designed with a striking retro-futuristic **Neo-Brutalism aesthetic**, the platform offers a clutter-free, high-performance interface for searching, filtering, and studying key startup, investing, and life lessons.

---

## ✨ Features

- **🎨 Neo-Brutalism Design System**: High-contrast interfaces, bold typography, hard shadows, and vibrant accent colors inspired by early design aesthetics.
- **🔮 Interactive 3D Ballpit Background**: Powered by **Three.js** and **GSAP**. A custom physical material with simulated subsurface scattering controls hundreds of interactive spheres that react to gravity, friction, and cursor movements.
- **🤖 AI-Powered Insight Extraction**: Paste raw YouTube transcripts, and the app leverages **Llama-3 (70B) via Groq API** to automatically distill exact quotes, categorize them, and generate structured takeaways.
- **🔒 Passcode-Gated Admin Panel**: A private moderation panel (`wtfnikhil`) allowing creators to review community suggestions, manually add insights, or trigger AI-driven transcript extractions.
- **💾 Offline Persistence & Local Cache**: Full synchronization with `localStorage` to keep user preferences, custom categories, and saved insights intact.
- **↗️ One-Click Share Sheets**: Shareable cards pre-formatted for social networks (X, LinkedIn) directly from the clipboard.

---

## 🛠️ Tech Stack

- **Core Framework**: React (v19)
- **3D Graphics & Physics**: Three.js, GSAP (GreenSock Animation Platform)
- **AI Processing**: Groq Cloud API (Llama 3.3 70B Versatile model)
- **Styling**: Vanilla CSS3 Custom Properties (Design tokens for light/dark neo-brutalism themes)
- **Deployment**: Optimized for Vercel / Netlify

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Yudhajit24/wtfinsights.git
   cd wtfinsights
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_GROQ_KEY=your_groq_api_key_here
   ```

4. Run the development server:
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

---

## 📂 Project Structure

```
├── public/
│   ├── favicon.ico       # Custom site icons
│   ├── index.html        # Custom SEO metadata & OpenGraph configurations
│   └── manifest.json     # Web app configurations
└── src/
    ├── App.js            # Main application layout, styles, and state machine
    ├── App.css           # Global fallback styles
    ├── BallpitBackground.js # High-performance 3D canvas simulation
    ├── index.js          # React bootloader
    └── index.css         # Reset & global styles
```

---

## 📄 License

This project is created for educational and community curation purposes. The content and intellectual property of the *WTF is Podcast* belong to Nikhil Kamath and their respective guests.
