import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element '#root' not found.");
}

const root = createRoot(rootElement);

async function bootstrap() {
  try {
    const { default: App } = await import("./App.tsx");
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (error: any) {
    console.error("Failed to load App module:", error);
    root.render(
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-2xl w-full rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Falha ao inicializar o app</h1>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
            {error?.message || String(error)}
          </pre>
        </div>
      </div>
    );
  }
}

bootstrap();
