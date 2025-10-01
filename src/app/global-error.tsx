"use client";

import React from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#f8f9fa"
          }}
        >
          <div
            style={{
              maxWidth: "500px",
              padding: "40px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              textAlign: "center"
            }}
          >
            <h1 style={{ color: "#dc3545", marginBottom: "20px" }}>
              ⚠️ Application Error
            </h1>
            <p style={{ color: "#6c757d", marginBottom: "30px" }}>
              {`We're sorry, but something went wrong. Our team has been notified
              and is working to fix the issue.`}
            </p>
            {process.env.NODE_ENV === "development" && (
              <details style={{ marginBottom: "20px", textAlign: "left" }}>
                <summary style={{ cursor: "pointer", marginBottom: "10px" }}>
                  Error Details (Development Only)
                </summary>
                <pre
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "10px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    overflow: "auto",
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {error.message}
                  {error.stack && `\n\nStack trace:\n${error.stack}`}
                </pre>
              </details>
            )}
            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={reset}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
