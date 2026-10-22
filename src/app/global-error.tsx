"use client";

import { useEffect } from "react";

// Last resort: replaces the root layout when it throws, so it renders its own
// <html>/<body> and gets none of globals.css -- hence inline styles, no Tailwind.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <title>Something went wrong · Mini Linear</title>
        <div role="alert" style={{ maxWidth: 384 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>
            This is usually temporary. Try again in a moment.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, opacity: 0.6, fontFamily: "monospace" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 24,
              padding: "10px 20px",
              borderRadius: 9999,
              border: "none",
              background: "#171717",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
