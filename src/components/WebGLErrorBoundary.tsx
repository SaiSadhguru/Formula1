import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGLErrorBoundary caught 3D viewport error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="relative w-full h-full min-h-[400px] bg-[#07080a] flex flex-col items-center justify-center p-6 text-center select-none carbon-grid-bg">
          <div className="max-w-lg bg-black/80 backdrop-blur-md border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-chakra font-black text-xl text-white tracking-wide uppercase mb-2">
              3D Viewport Offline
            </h3>

            <p className="text-xs font-mono-tech text-gray-400 leading-relaxed mb-6">
              WebGL hardware acceleration encountered an issue or is disabled in your browser. All other APEX telemetry, race strategy, and technical analysis suites remain fully operational.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-left font-mono-tech text-[11px] text-gray-400 mb-6 space-y-1">
              <div className="text-gray-300 font-bold mb-1">Diagnostics & Troubleshooting:</div>
              <div>• Enable Hardware Acceleration in browser settings</div>
              <div>• Verify WebGL2 support at <code className="text-[#66ff00]">get.webgl.org/webgl2</code></div>
              <div>• Error: <span className="text-amber-400">{this.state.error?.message || 'Context creation failure'}</span></div>
            </div>

            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#66ff00] hover:bg-[#58dc00] text-black font-chakra font-black text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-[0_0_15px_rgba(102,255,0,0.3)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry 3D Initialization</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
