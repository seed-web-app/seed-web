"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  isAvailableUsernameFormat,
  normalizeUsername,
} from "@/lib/tenancy";

type ClaimResponse = {
  message?: string;
  dashboardUrl?: string;
};

export function UsernameSetupForm({ rootDomain }: { rootDomain: string }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const valid = isAvailableUsernameFormat(username);

  async function claimUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || saving) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = (await response.json()) as ClaimResponse;

      if (!response.ok || !data.dashboardUrl) {
        setError(data.message ?? "That address could not be created.");
        return;
      }

      window.location.assign(data.dashboardUrl);
    } catch {
      setError("The server could not be reached. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="username-form" onSubmit={claimUsername}>
      <label htmlFor="username">Your username</label>
      <div className="username-input-wrap">
        <span aria-hidden="true">@</span>
        <input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          minLength={3}
          maxLength={30}
          value={username}
          onChange={(event) => {
            setUsername(normalizeUsername(event.target.value));
            setError(null);
          }}
          placeholder="yourname"
          aria-describedby="username-help username-preview"
          aria-invalid={Boolean(error)}
          autoFocus
        />
        <b aria-hidden="true">{valid ? "✓" : ""}</b>
      </div>
      <p id="username-help" className="username-help">
        Use 3–30 letters, numbers, or hyphens.
      </p>
      <div id="username-preview" className="username-preview">
        <span>Your new address</span>
        <strong>
          {username || "yourname"}.{rootDomain}
        </strong>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="google-button username-submit" disabled={!valid || saving}>
        {saving ? "Creating your address…" : "Create my workspace"}
        {!saving ? <span aria-hidden="true">→</span> : null}
      </button>
    </form>
  );
}
