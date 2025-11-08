# ABA Behavior Tracker - Progressive Web Application

A comprehensive Applied Behavior Analysis (ABA) behavior tracking and management system built as a responsive, bilingual Progressive Web App.

## 🌟 Features

### Core Functionality
- **Behavior Tracking (ABC Data)**
  - Antecedent-Behavior-Consequence data collection
  - Severity levels (1-5 scale: Mild to Critical)
  - Behavior function tracking (Escape, Attention, Tangible, Sensory)
  - Duration, intensity, location, and detailed notes
  - Real-time behavior entry with date/time tracking

- **Reinforcer Management**
  - Track reinforcers (edibles, tangibles, activities, social)
  - Usage frequency monitoring
  - Effectiveness ratings (1-5 scale)
  - Automatic repetition avoidance based on configurable days
  - Usage history and statistics

- **Crisis Behavior Protocols**
  - Pre-defined crisis management protocols
  - Trigger conditions and warning signs
  - Prevention strategies
  - Step-by-step intervention procedures
  - De-escalation techniques
  - Post-crisis follow-up procedures
  - Emergency contact management
  - Active/inactive protocol toggling

- **Analytics & Insights**
  - Interactive data visualizations and charts
  - Behavior frequency trends over time
  - Severity distribution analysis
  - Behavior function analysis
  - Time-of-day pattern detection
  - Automatic milestone detection (improvements/regressions)
  - Customizable time range filtering (7, 14, 30, 90 days)
  - CSV data export capability

- **AI-Powered Analysis (Google Gemini)**
  - Behavioral pattern analysis
  - Predictive analytics for potential triggers
  - Evidence-based intervention strategy recommendations
  - Risk level assessment
  - Crisis protocol generation
  - ABA methodology-based insights

- **Multimodal Real-time Input (NEW!)**
  - **Voice Conversation Mode**: Natural voice-based behavior entry through AI-guided conversation
  - **Video Streaming Analysis**: Real-time video processing with automatic behavior detection
  - **Interruptible Conversations**: Natural dialog flow with ability to interrupt AI responses
  - **Automatic Data Extraction**: AI extracts ABC data from conversations and auto-fills forms
  - **Emotion & Movement Detection**: Video analysis identifies facial expressions, emotions, and behavioral intensity
  - **Bilingual Voice Support**: Full conversational support in English and Spanish
  - **Privacy-First Design**: API keys per session, no permanent storage

### Technical Features
- **Progressive Web App (PWA)**
  - Offline functionality with IndexedDB storage
  - Installable on mobile and desktop devices
  - App-like experience
  - Background sync capability

- **Bilingual Support**
  - Full English and Spanish translations
  - One-click language switching
  - Localized date and number formatting

- **Responsive Design**
  - Mobile-first approach
  - Tablet and desktop optimized
  - Dark mode support
  - Touch-friendly interface

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key (optional, for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd autism
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## 📱 Progressive Web App Installation

### Mobile (iOS/Android)
1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap the Share button (iOS) or menu (Android)
3. Select "Add to Home Screen"
4. The app will appear as a standalone app on your device

### Desktop
1. Open the app in Chrome, Edge, or another PWA-compatible browser
2. Click the install icon in the address bar
3. Confirm the installation

## 🔑 API Configuration

### Google Gemini API (Optional)
The app supports AI-powered analysis using Google Gemini:

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Enter the API key in any of the AI analysis sections:
   - Behavior form → AI Analysis
   - Crisis protocols → AI Generator
   - Analytics page → AI-Powered Analysis

**Note:** The API key is stored in-memory only and never persisted. You'll need to enter it each session.

## 🎙️ Using Multimodal Input Features

### Voice Conversation Mode
1. Navigate to **Behaviors → New Behavior Entry**
2. Click on **"Voice Conversation"** button
3. Enter your Gemini API key when prompted
4. Click **"Start Recording"** to begin
5. Speak naturally about the behavior incident
6. The AI will ask follow-up questions to gather ABC data
7. You can interrupt the AI at any time to correct or add information
8. Click **"Stop Recording"** when finished
9. Review the auto-filled form and save

**Tips:**
- Speak clearly and naturally
- You can switch between typing and speaking at any time
- The AI understands context from previous messages
- Pause/resume recording as needed

### Voice + Video Analysis Mode
1. Navigate to **Behaviors → New Behavior Entry**
2. Click on **"Voice + Video Analysis"** button
3. Enter your Gemini API key when prompted
4. Grant camera and microphone permissions
5. Position the camera to show the individual
6. Click **"Start Recording"**
7. Speak about the incident while the video captures behavior
8. The AI analyzes both your voice and the video in real-time
9. Video analysis detects:
   - Observable behaviors and movements
   - Facial expressions and emotions
   - Intensity levels
   - Behavioral patterns
10. All insights are integrated into the conversation and form

**Tips:**
- Ensure good lighting for better video analysis
- Use the environment-facing camera (back camera) to record the individual
- Switch cameras using the camera button if needed
- Video analysis updates every 2 seconds
- Toggle the analysis overlay on/off with the eye icon

### Conversation Controls
- **Pause/Resume**: Pause recording temporarily without ending the session
- **Interrupt**: Stop AI's current response to provide immediate input
- **Speaker Toggle**: Mute/unmute AI voice responses
- **Text Input**: Type messages alongside or instead of voice input

**Privacy Notes:**
- All processing happens in real-time
- Video frames are analyzed and discarded (not stored)
- Only extracted ABC data is saved to your local database
- Camera and microphone access is only active during recording

## 🏗️ Technology Stack

- **Framework:** Next.js 16 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Data Storage:** IndexedDB (client-side)
- **PWA:** @ducanh2912/next-pwa
- **Internationalization:** next-i18next
- **AI Integration:** Google Generative AI (Gemini)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Utilities:** date-fns

## 📊 ABA Methodology

This application follows gold standards from Applied Behavior Analysis (ABA):

### ABC Data Collection
- **Antecedent:** Events occurring before the behavior
- **Behavior:** Objective description of the behavior
- **Consequence:** What happened immediately after

### Behavior Functions
Based on the four main functions of behavior:
1. **Escape/Avoidance:** To get away from something
2. **Attention:** To gain attention from others
3. **Tangible:** To gain access to items or activities
4. **Sensory:** For sensory stimulation or feedback

### Data-Driven Decision Making
- Regular data collection and analysis
- Pattern identification
- Evidence-based intervention strategies
- Progress monitoring through milestones

## 📁 Project Structure

```
/
├── pages/              # Next.js pages
│   ├── index.tsx      # Dashboard
│   ├── behaviors/     # Behavior tracking
│   ├── reinforcers.tsx # Reinforcer management
│   ├── crisis.tsx     # Crisis protocols
│   └── analytics.tsx  # Analytics and charts
├── components/        # React components
│   └── Layout.tsx     # Main layout wrapper
├── lib/               # Utilities and business logic
│   ├── db.ts         # IndexedDB wrapper
│   ├── gemini.ts     # Google Gemini integration
│   └── analytics.ts  # Analytics calculations
├── types/            # TypeScript type definitions
├── styles/           # Global styles
├── public/           # Static assets
│   ├── locales/      # Translation files
│   └── manifest.json # PWA manifest
└── data/             # Data storage (gitignored)
```

## 🔒 Data Privacy

- All data is stored locally in the browser's IndexedDB
- No data is sent to external servers (except when using AI features)
- AI analysis uses only the data you explicitly submit
- API keys are never stored permanently
- Works completely offline after initial load

## 🌐 Browser Support

- Chrome/Edge 90+
- Safari 15+
- Firefox 88+
- Mobile browsers (iOS Safari 15+, Chrome Android 90+)

## 📝 License

ISC

## 🤝 Contributing

This is a specialized ABA tracking application. Please ensure any contributions follow ABA best practices and maintain HIPAA-like privacy standards.

## 📧 Support

For issues or questions, please refer to the application's built-in help system or consult with a Board Certified Behavior Analyst (BCBA) for ABA methodology questions.

## ⚠️ Disclaimer

This application is a tool for data collection and analysis. It does not replace professional clinical judgment or the guidance of qualified behavior analysts. Always consult with a BCBA or qualified professional for behavior intervention planning and implementation.
