import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "Erro inesperado na aplicação.",
    };
  }

  componentDidCatch(error: Error) {
    console.error("Unhandled React error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-xl w-full rounded-lg border bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">Erro ao carregar a aplicação</h1>
            <p className="mt-2 text-sm text-gray-600">{this.state.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
