/**
 * APEX OpenF1 Race Data Service
 *
 * Fetches historical session, stint, and pit-stop data from the OpenF1 API.
 * Free public API — no authentication required.
 * Base URL: https://api.openf1.org/v1
 *
 * Data is clearly labeled as historical. Never claimed to be live telemetry.
 * Falls back to curated demo data when the API is unavailable.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OpenF1Session {
  session_key: number;
  session_type: string;
  session_name: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  country_name: string;
  location: string;
  year: number;
}

export interface OpenF1Stint {
  meeting_key: number;
  session_key: number;
  stint_number: number;
  driver_number: number;
  lap_start: number;
  lap_end: number;
  compound: string;
  tyre_age_at_start: number;
}

export interface OpenF1Pit {
  meeting_key: number;
  session_key: number;
  driver_number: number;
  lap_number: number;
  pit_duration: number | null;
  date: string;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  country_code: string;
}

export interface RaceSessionInfo {
  sessionKey: number;
  sessionName: string;
  circuit: string;
  country: string;
  year: number;
  dateStart: string;
  source: 'openf1' | 'demo';
}

export interface DriverStintData {
  driverNumber: number;
  driverName: string;
  teamName: string;
  stints: Array<{
    stintNumber: number;
    compound: string;
    lapStart: number;
    lapEnd: number;
    tyreAgeAtStart: number;
    stintLength: number;
  }>;
  pitStops: Array<{
    lap: number;
    pitDuration: number | null;
  }>;
  source: 'openf1' | 'demo';
}

// ─── Demo Fallback Data ───────────────────────────────────────────────────────
// Monaco 2024 — a classic two-stop race. Used when API is unavailable.

const DEMO_SESSION: RaceSessionInfo = {
  sessionKey: 9523,
  sessionName: 'Race',
  circuit: 'Monte Carlo',
  country: 'Monaco',
  year: 2024,
  dateStart: '2024-05-26T13:00:00+00:00',
  source: 'demo',
};

const DEMO_DRIVER_STINTS: DriverStintData[] = [
  {
    driverNumber: 44,
    driverName: 'L. HAMILTON',
    teamName: 'Mercedes',
    stints: [
      { stintNumber: 1, compound: 'MEDIUM', lapStart: 1, lapEnd: 50, tyreAgeAtStart: 0, stintLength: 50 },
      { stintNumber: 2, compound: 'HARD', lapStart: 51, lapEnd: 78, tyreAgeAtStart: 0, stintLength: 27 },
    ],
    pitStops: [{ lap: 50, pitDuration: 22.3 }],
    source: 'demo',
  },
  {
    driverNumber: 1,
    driverName: 'M. VERSTAPPEN',
    teamName: 'Red Bull Racing',
    stints: [
      { stintNumber: 1, compound: 'MEDIUM', lapStart: 1, lapEnd: 33, tyreAgeAtStart: 0, stintLength: 33 },
      { stintNumber: 2, compound: 'HARD', lapStart: 34, lapEnd: 78, tyreAgeAtStart: 0, stintLength: 45 },
    ],
    pitStops: [{ lap: 33, pitDuration: 21.8 }],
    source: 'demo',
  },
  {
    driverNumber: 16,
    driverName: 'C. LECLERC',
    teamName: 'Ferrari',
    stints: [
      { stintNumber: 1, compound: 'SOFT', lapStart: 1, lapEnd: 22, tyreAgeAtStart: 0, stintLength: 22 },
      { stintNumber: 2, compound: 'MEDIUM', lapStart: 23, lapEnd: 55, tyreAgeAtStart: 0, stintLength: 33 },
      { stintNumber: 3, compound: 'HARD', lapStart: 56, lapEnd: 78, tyreAgeAtStart: 0, stintLength: 22 },
    ],
    pitStops: [
      { lap: 22, pitDuration: 21.1 },
      { lap: 55, pitDuration: 22.6 },
    ],
    source: 'demo',
  },
];

// ─── Cache ───────────────────────────────────────────────────────────────────

const cache: Map<string, { data: unknown; ts: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, ts: Date.now() });
}

// ─── API Fetcher ───────────────────────────────────────────────────────────────

const BASE_URL = 'https://api.openf1.org/v1';

async function apiFetch<T>(path: string): Promise<T> {
  const cacheKey = path;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as T;
    setCache(cacheKey, data);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public Service Functions ─────────────────────────────────────────────────

/**
 * Fetch available race sessions for a given year.
 * Returns an empty array and logs a warning on failure.
 */
export async function fetchRaceSessions(year: number): Promise<RaceSessionInfo[]> {
  try {
    const sessions = await apiFetch<OpenF1Session[]>(
      `/sessions?year=${year}&session_name=Race`,
    );
    return sessions
      .filter((s) => s.session_name === 'Race')
      .map((s) => ({
        sessionKey: s.session_key,
        sessionName: s.session_name,
        circuit: s.circuit_short_name,
        country: s.country_name,
        year: s.year,
        dateStart: s.date_start,
        source: 'openf1' as const,
      }));
  } catch (err) {
    console.warn('[OpenF1] fetchRaceSessions failed, returning empty list:', err);
    return [];
  }
}

/**
 * Fetch driver stint data for a session.
 * Falls back to Monaco 2024 demo data on failure.
 */
export async function fetchSessionStints(
  sessionKey: number,
): Promise<{ stints: OpenF1Stint[]; source: 'openf1' | 'demo' }> {
  try {
    const stints = await apiFetch<OpenF1Stint[]>(`/stints?session_key=${sessionKey}`);
    return { stints, source: 'openf1' };
  } catch (err) {
    console.warn('[OpenF1] fetchSessionStints failed, using demo data:', err);
    return {
      stints: DEMO_DRIVER_STINTS.flatMap((d) =>
        d.stints.map((s) => ({
          meeting_key: 1236,
          session_key: 9523,
          stint_number: s.stintNumber,
          driver_number: d.driverNumber,
          lap_start: s.lapStart,
          lap_end: s.lapEnd,
          compound: s.compound,
          tyre_age_at_start: s.tyreAgeAtStart,
        })),
      ),
      source: 'demo',
    };
  }
}

/**
 * Fetch pit-stop data for a session.
 * Falls back to demo data on failure.
 */
export async function fetchSessionPits(
  sessionKey: number,
): Promise<{ pits: OpenF1Pit[]; source: 'openf1' | 'demo' }> {
  try {
    const pits = await apiFetch<OpenF1Pit[]>(`/pit?session_key=${sessionKey}`);
    return { pits, source: 'openf1' };
  } catch (err) {
    console.warn('[OpenF1] fetchSessionPits failed, using demo data:', err);
    return {
      pits: DEMO_DRIVER_STINTS.flatMap((d) =>
        d.pitStops.map((p) => ({
          meeting_key: 1236,
          session_key: 9523,
          driver_number: d.driverNumber,
          lap_number: p.lap,
          pit_duration: p.pitDuration,
          date: '2024-05-26T13:00:00+00:00',
        })),
      ),
      source: 'demo',
    };
  }
}

/**
 * Fetch drivers for a session.
 */
export async function fetchSessionDrivers(
  sessionKey: number,
): Promise<OpenF1Driver[]> {
  try {
    return await apiFetch<OpenF1Driver[]>(`/drivers?session_key=${sessionKey}`);
  } catch (err) {
    console.warn('[OpenF1] fetchSessionDrivers failed:', err);
    return [];
  }
}

/**
 * High-level: get full structured strategy data for a session and driver.
 * Always falls back gracefully to demo data.
 */
export async function fetchDriverRaceStrategy(
  sessionKey: number,
  driverNumber: number,
): Promise<DriverStintData> {
  const demo = DEMO_DRIVER_STINTS.find((d) => d.driverNumber === driverNumber)
    ?? DEMO_DRIVER_STINTS[0];

  try {
    const [{ stints, source }, { pits }] = await Promise.all([
      fetchSessionStints(sessionKey),
      fetchSessionPits(sessionKey),
    ]);

    const driverStints = stints
      .filter((s) => s.driver_number === driverNumber)
      .sort((a, b) => a.stint_number - b.stint_number);

    const driverPits = pits
      .filter((p) => p.driver_number === driverNumber)
      .sort((a, b) => a.lap_number - b.lap_number);

    if (driverStints.length === 0) {
      return { ...demo, source: 'demo' };
    }

    const drivers = await fetchSessionDrivers(sessionKey);
    const driver = drivers.find((d) => d.driver_number === driverNumber);

    return {
      driverNumber,
      driverName: driver?.broadcast_name ?? `#${driverNumber}`,
      teamName: driver?.team_name ?? 'Unknown',
      stints: driverStints.map((s) => ({
        stintNumber: s.stint_number,
        compound: s.compound,
        lapStart: s.lap_start,
        lapEnd: s.lap_end,
        tyreAgeAtStart: s.tyre_age_at_start,
        stintLength: s.lap_end - s.lap_start + 1,
      })),
      pitStops: driverPits.map((p) => ({
        lap: p.lap_number,
        pitDuration: p.pit_duration,
      })),
      source,
    };
  } catch {
    return { ...demo, source: 'demo' };
  }
}

/** Return the built-in Monaco 2024 demo session info */
export function getDemoSession(): RaceSessionInfo {
  return { ...DEMO_SESSION };
}

/** Return all built-in demo driver strategy data */
export function getDemoDriverStints(): DriverStintData[] {
  return DEMO_DRIVER_STINTS.map((d) => ({ ...d }));
}
