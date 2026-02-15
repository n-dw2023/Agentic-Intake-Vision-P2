import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { EntryGate } from "./components/EntryGate";
import App from "./App";
import "./index.css";

function Root() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-app)]">
        <span className="text-[var(--color-text-secondary)]">Checking session…</span>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <EntryGate />;
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>
);
