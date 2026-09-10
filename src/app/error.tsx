"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="message-page">
      <p className="section-label">Something went wrong</p>
      <h1>The page could not be loaded.</h1>
      <button className="primary-action" onClick={reset} type="button">
        Try again
      </button>
    </main>
  );
}
