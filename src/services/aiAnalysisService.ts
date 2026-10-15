import { StrategyReport, getLocalEngineeringRecommendation } from '../utils/localRecommendations.ts';

export interface AIAnalysisRequest {
  component: string;
  circuit: string;
  target: string;
  setup: Record<string, any>;
  telemetry?: {
    speedKmh?: number;
    rpm?: number;
    ersLevel?: number;
    gear?: number;
  };
}

export interface AIAnalysisResponse {
  report: StrategyReport;
  source: 'ai-server' | 'local-deterministic';
  provider?: string;
  message?: string;
}

/**
 * Client service abstraction for AI engineering analysis
 * Communicates with backend endpoint /api/ai-analysis if available;
 * cleanly falls back to the deterministic local engine.
 */
export async function requestStrategyAnalysis(
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch('/api/ai-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.result && data.result.recommendation) {
        return {
          report: data.result as StrategyReport,
          source: 'ai-server',
          provider: data.provider || 'cloud-ai',
        };
      }
    }
  } catch (err) {
    // Server offline or network error — non-blocking fallback to local engine
    console.info('APEX Strategy: Server AI unavailable, utilizing deterministic engineering engine.');
  }

  // Local deterministic fallback
  const localReport = getLocalEngineeringRecommendation(
    request.component,
    request.circuit,
    request.target,
    request.setup
  );

  return {
    report: localReport,
    source: 'local-deterministic',
    message: 'Local rule-based engineering analysis engine (Deterministic simulation model).',
  };
}
