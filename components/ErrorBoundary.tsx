"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[System Error]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="bg-system min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <p className="title-font text-2xl text-[#ef4444]" style={{ textShadow: "0 0 20px rgba(239,68,68,0.5)" }}>
            SYSTEM FAILURE
          </p>
          <p className="mono text-xs text-[#9aa6bd] mt-3 max-w-sm">
            The Shadow Monarch could not be summoned.
          </p>
          <p className="term text-[10px] text-[#6b7280] mt-2">
            {this.state.error?.message || "Unknown error"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-5 py-2 border text-[11px] tracking-widest uppercase transition-opacity hover:opacity-80"
            style={{ borderColor: "var(--line-strong)", color: "#eaf6ff" }}
          >
            Reboot System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
