import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./styles/globals.css";

// Optional error monitoring — activates only when VITE_SENTRY_DSN is set.
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (dsn) {
  import("@sentry/react").then((Sentry) => {
    Sentry.init({ dsn, tracesSampleRate: 0.1, environment: import.meta.env.MODE });
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
