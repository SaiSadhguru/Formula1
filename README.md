# APEX — Formula 1 3D Car & Telemetry Hub + Pit Strategist

An immersive Formula 1 engineering dashboard featuring a genuine 3D race car viewer, real-time telemetry HUD, deterministic pit-strategy simulation engine, OpenF1 historical race data explorer, and optional Gemini-powered AI pit-wall commentary.

---

## 🏎️ Features

- **Genuine 3D WebGL Car Viewer (`F1Canvas.tsx`)**: Three.js viewport loading `public/models/f1-car.glb` (5.5m regulation scale, PBR materials, custom studio environment PMREM, contact shadows, OrbitControls with camera presets).
- **Interactive Controls (`BottomControlDock.tsx`)**: Livery configurator (Audi Revolut Acid Green, Stealth Carbon Red, Monza Alpine Pearl, Gulf Heritage Blue), camera angles (Hero 3/4, Cockpit POV, Side Profile, Aero Top, Diffuser), and CFD wireframe mode.
- **Dynamic Telemetry HUD (`TelemetryHUD.tsx`)**: Real-time cockpit cluster with RPM LED rev lights, digital speed/gear/RPM gauge, active DRS toggle, and simulated run dynamics.
- **Official Hackathon Championship Scenario Preset (Lap 31/53 — P3)**:
  - Preset representing the official challenge: Lap 31 of 53, P3, accelerating tyre wear, approaching rain, Safety Car deployed, and rivals pitting.
  - Interactive multi-variable simulation engine modeling:
    - **Tyre degradation curves**: 5 Pirelli compounds (Soft, Medium, Hard, Intermediates, Full Wet) with specific wear rates and cliff thresholds
    - **Fuel consumption & weight model**: kg remaining, burn rate per lap, fuel-weight pace penalty, and fuel feasibility / shortfall detection
    - **Weather & rain crossover**: Dynamic rain probability, wet compound recommendation, and crossover lap estimation
    - **Safety Car scenario**: 30% reduction in pit-lane time loss (~15.4s vs ~22.0s), cheap pit window optimization
    - **Rival pit tracker & undercut/overcut analysis**: Track competitor stops, undercut threats, and overcut opportunities
    - **Urgent Callout & Recommendation**: Real-time strategic action ("PIT THIS LAP", "PIT NOW FOR INTERS", "MATCH RIVAL PIT", etc.) with clear urgency ratings (NOW / SOON / MONITOR)
  - Pure, deterministic calculation engine fully independent of the UI and covered by comprehensive unit tests
- **OpenF1 Historical Race Data (`openF1Service.ts`)**:
  - Connects to the public [OpenF1 API](https://openf1.org/) (`api.openf1.org/v1`)
  - Fetches 2024 season race sessions, driver stint histories, and actual pit-stop durations
  - 5-minute memory caching and automatic timeout handling
  - Curated Monaco 2024 demo-data fallback when offline or rate-limited
  - Clear source attribution — never silently replaces real data with simulated numbers
- **AI Pit-Wall Commentary (`@google/genai`)**:
  - Optional Gemini commentary translating mathematical strategy results into professional race engineer radio calls
  - Works safely without an API key (displays standard deterministic rationale)
- **Discreet Ambient Audio Player (`AudioPlayer.tsx`)**:
  - User-controlled playback with smooth fade-in/fade-out, volume slider, and mute toggle
  - Fails gracefully without errors if the audio asset is missing

---

## 📋 Prerequisites

- **Node.js**: v20+ recommended (verified on Node.js v24.18.0)
- **npm**: v10+ (verified on npm 11.16.0)

---

## 🚀 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Variables (Optional)

Create a `.env.local` file from the example template:

```bash
cp .env.example .env.local
```

| Variable | Required? | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` (or `GEMINI_API_KEY`) | Optional | Google Gemini API key for AI pit-wall commentary. The app runs fully without this key. |
| `APP_URL` | Optional | Hosting URL used when deploying on Cloud Run / AI Studio. |

### 3. Launch Development Server

```bash
npm run dev
```

The Vite dev server starts with host access:
- **Local URL**: `http://localhost:3000/`
- **Network URL**: `http://<your-ip>:3000/`

*(If port 3000 is occupied, Vite will automatically increment to the next available port).*

---

## 🧪 Testing & Quality Checks

### Run Unit Tests
Executes the pure TypeScript strategy engine test suite (58 unit tests covering stint times, degradation math, pit windows, one/two-stop models, safety car discounts, fuel models, weather crossovers, rival undercut/overcuts, the official Lap 31/53 scenario, edge cases, and time formatters):

```bash
npm test
```

### Type Checking
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

Production output will be generated in `dist/`.

---

## 🎵 Ambient Audio Placement

To enable background ambient music:
1. Place a royalty-free / licensed MP3 file at:
   ```
   public/audio/apex-ambient.mp3
   ```
2. Recommended sources for royalty-free audio:
   - [Free Music Archive](https://freemusicarchive.org/)
   - [Pixabay Music](https://pixabay.com/music/) (CC0 / royalty-free)
3. Document any required license or artist attribution in your project's credits.
4. **Note**: If `public/audio/apex-ambient.mp3` is absent, the player handles it gracefully without errors.

---

## 🔌 Architecture & MCP Integration Notes

### Runtime Strategy
The client application is intentionally self-contained:
- Strategy math executes locally in the browser via `src/utils/pitStrategyCalc.ts` (instant feedback, zero server latency).
- OpenF1 data is fetched directly via public CORS-enabled endpoints (`https://api.openf1.org/v1`).
- Gemini AI calls are made client-side using `@google/genai` when an API key is present in `.env.local`.

### Optional MCP Server Integration
If integrating into an agentic workflow (e.g., Claude Desktop, Cursor, Antigravity), an external Model Context Protocol (MCP) server can expose tools such as:
- `f1_compare_strategy({ totalLaps, currentLap, compound, ... })`: Returns one-stop vs two-stop calculations
- `f1_get_session_stints({ sessionKey, driverNumber })`: Queries OpenF1 for actual pit stops
- `f1_explain_strategy({ result })`: Formats engineer commentary

The web UI does not require an MCP server to operate.

---

## ⚠️ Known Limitations & Assumptions

1. **Simulation Math**: Tire degradation is modeled with compound-specific linear wear coefficients (`0.055s/lap` Soft, `0.032s/lap` Medium, `0.018s/lap` Hard). Real-world degradation includes non-linear thermal blistering, track rubbering, and fuel burn-off deltas.
2. **OpenF1 Free Tier**: The OpenF1 API is a community-supported open API. High request frequencies can occasionally trigger rate limits (handled gracefully via in-memory caching and fallback to curated Monaco 2024 data).
3. **Audio Autoplay**: Modern browsers block unprompted audio playback. Audio will only start after an explicit user click on the play button.
