# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an ABA (Applied Behavior Analysis) behavior tracking Progressive Web Application built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. The application helps parents and caregivers track behaviors using the ABC (Antecedent-Behavior-Consequence) methodology and includes advanced AI-powered features for real-time behavior entry and analysis.

**Key characteristic:** This is a privacy-first, offline-capable PWA with all data stored locally in IndexedDB. AI features are optional and use Google Gemini API.

## Development Commands

### Essential Commands
```bash
npm install              # Install dependencies
npm run dev             # Start development server (localhost:3000)
npm run build           # Build for production
npm start               # Start production server
npm run lint            # Run Next.js linter
```

### Testing Individual Pages
Since this is a Next.js app, navigate directly to routes in the browser:
- `/` - Dashboard
- `/behaviors` - Behavior list
- `/behaviors/new` - New behavior entry form
- `/reinforcers` - Reinforcer management
- `/crisis` - Crisis protocols
- `/analytics` - Analytics and insights

## Architecture & Data Flow

### Data Storage Layer
All data is stored client-side using IndexedDB via the `lib/db.ts` wrapper class.

**Three main stores:**
- `behaviors` - ABC behavior entries with indexes on date, severity, function
- `reinforcers` - Reinforcer tracking with indexes on type, lastUsed
- `crisisProtocols` - Crisis management protocols with index on isActive

**Important:** Never add server-side database code. This app is designed to run entirely client-side with no backend persistence.

### Type System
All core types are defined in `types/index.ts`:
- `BehaviorEntry` - ABC data with severity (1-5) and function (escape, attention, tangible, sensory)
- `Reinforcer` - Items/activities with effectiveness ratings and repetition avoidance
- `CrisisProtocol` - Crisis intervention procedures
- `BehaviorAnalytics` - Calculated metrics for data visualization

### AI Integration Architecture
The app uses Google Gemini with **per-session API keys** (never persisted). Three distinct AI systems:

1. **Voice Conversation** (`lib/voice-conversation.ts`, `components/VoiceConversation.tsx`)
   - Uses Gemini 2.0 Flash Exp with real-time audio streaming
   - Conversational ABC data collection
   - Extracts structured behavior data from natural language
   - Supports interruptions and pause/resume

2. **Multimodal Conversation** (`lib/multimodal-conversation.ts`, `components/MultimodalConversation.tsx`)
   - Voice + video streaming analysis
   - Real-time emotion and movement detection from video frames
   - Analyzes video every 2 seconds, frames are discarded after analysis
   - Supports camera switching (user/environment facing)

3. **Contextual Chat Assistant** (`lib/contextual-chat.ts`, `components/ContextualChat.tsx`)
   - Personalized AI assistant with full context of child's behavior history
   - Generates child-specific insights and recommendations
   - Uses analytics summary + recent 20 behaviors for context
   - Parent-friendly, empathetic language

4. **PDF Import** (`lib/pdf-import.ts`, `components/PDFImport.tsx`)
   - Extracts ABC data from ABA provider PDF reports
   - Batch processing with review/validation UI

### Internationalization (i18n)
- Full English/Spanish support via next-i18next
- Translation files in `public/locales/{en,es}/common.json`
- Language switching in Layout component
- AI features respect language setting (prompts and responses adapt)

### PWA Configuration
- Service worker generated via @ducanh2912/next-pwa
- Disabled in development, enabled in production
- Manifest in `public/manifest.json`
- Offline functionality relies on IndexedDB (not service worker cache)

## Key Implementation Patterns

### Working with IndexedDB
Always use the singleton instance from `lib/db.ts`:
```typescript
import { db, STORES } from '@/lib/db';

// Add
await db.add(STORES.BEHAVIORS, behaviorEntry);

// Get all
const behaviors = await db.getAll<BehaviorEntry>(STORES.BEHAVIORS);

// Update
await db.update(STORES.BEHAVIORS, updatedBehavior);

// Query by index
const recent = await db.query<BehaviorEntry>(
  STORES.BEHAVIORS,
  'date',
  '2024-01-15'
);
```

### AI Feature Pattern
All AI features follow this pattern:
1. Check if API key exists in component state (in-memory only)
2. Initialize AI class/function with API key
3. Call AI method with behavior data + language preference
4. Handle streaming/real-time responses
5. Extract structured data from AI responses (JSON parsing with fallback)

**Never persist API keys.** Always prompt user per session.

### ABA Methodology Compliance
When modifying behavior tracking or analysis features:
- Maintain objective, observable behavior descriptions
- Preserve ABC data structure (antecedent, behavior, consequence)
- Keep severity scale 1-5 (Mild, Moderate, Significant, Severe, Critical)
- Maintain four behavior functions (Escape, Attention, Tangible, Sensory)
- Ensure data-driven decision making (analytics should drive recommendations)

### Component Structure
- `pages/` - Next.js pages (routes)
- `components/` - Reusable React components
- `lib/` - Business logic, utilities, AI integrations
- `types/` - TypeScript type definitions
- `public/locales/` - i18n translation files

## Special Considerations

### Privacy & Security
- **Never** add analytics tracking or telemetry
- **Never** send data to external servers (except Gemini API for AI features)
- **Never** persist API keys in localStorage, cookies, or any storage
- All behavior data must stay in client-side IndexedDB
- PDF processing must happen client-side only

### Real-time Audio/Video
- MediaRecorder API is used for audio/video capture
- Audio: 16kHz sample rate, mono channel, opus codec
- Video: 1280x720 ideal, 30fps, frames processed then discarded
- Always request permissions before accessing media devices
- Clean up media streams on component unmount

### Analytics Calculations
Analytics are calculated client-side in `lib/analytics.ts`:
- Behavior frequency over time
- Severity distribution
- Function analysis
- Time-of-day patterns
- Automatic milestone detection (improvements/regressions)

When adding new analytics, update `calculateBehaviorAnalytics()` function.

### Bilingual AI Prompts
All AI prompts must support both English and Spanish:
- Include language-specific system prompts
- Request JSON responses (language-agnostic structure)
- Use parent-friendly terminology in both languages
- Maintain ABA professional standards in both languages

## Deployment

Production deployment uses automated script: `deploy.sh`
- Installs Node.js, nginx, Certbot, PM2
- Builds Next.js app
- Configures nginx reverse proxy
- Obtains Let's Encrypt SSL certificate
- Starts app with PM2 process manager

See `DEPLOYMENT.md` for detailed instructions.

## Common Pitfalls to Avoid

1. **Don't add server-side API routes** - This is a client-only PWA
2. **Don't use localStorage for behaviors** - Must use IndexedDB for offline support
3. **Don't skip language parameter** - All AI functions accept language: 'en' | 'es'
4. **Don't hardcode API keys** - Always prompt user
5. **Don't add generic behavior advice** - AI must analyze child's specific data
6. **Don't store video frames** - Process and discard immediately
7. **Don't break PWA offline functionality** - Test without network access

## Path Aliases

TypeScript is configured with path alias:
```typescript
import { db } from '@/lib/db';
import { BehaviorEntry } from '@/types';
```

The `@/` prefix maps to the project root.
