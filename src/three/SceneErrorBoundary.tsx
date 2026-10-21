import { Component, type ReactNode } from "react";

interface BoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}
interface BoundaryState {
  failed: boolean;
}

/** Catches WebGL context creation failures (or any scene error) and renders the 2D fallback instead. */
export class SceneErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };
  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.warn("[SceneCanvas] falling back to 2D:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
