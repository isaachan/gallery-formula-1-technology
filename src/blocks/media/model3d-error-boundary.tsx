"use client";

import { Component, type ReactNode } from "react";
import { reportRendererFailure } from "@/lib/error-reporting";

export class Model3DErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode; mediaId?: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    reportRendererFailure({
      kind: "model3d",
      mediaId: this.props.mediaId,
      message: error.message,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
