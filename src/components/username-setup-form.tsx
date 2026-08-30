"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, AtSign, Check } from "lucide-react";
import {
  isAvailableUsernameFormat,
  normalizeUsername,
} from "@/lib/tenancy";

type ClaimResponse = {
  message?: string;
  username?: string;
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
        setError(data.message ?? "Seed could not save that username.");
        return;
      }
      window.location.assign(data.dashboardUrl);
    } catch {
      setError("Seed could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="username-form" onSubmit={claimUsername}>
      <label htmlFor="username">Choose your username</label>
      <div className="username-input-wrap">
        <AtSign aria-hidden="true" size={18} />
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
        {valid && <Check aria-label="Valid username" size={18} />}
      </div>
      <p id="username-help" className="username-help">
        3–30 letters, numbers, or hyphens. You cannot change it later.
      </p>
      <div id="username-preview" className="username-preview">
        <span>Your private dashboard address</span>
        <strong>{username || "yourname"}.{rootDomain}</strong>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="button button-dark username-submit"
        disabled={!valid || saving}
      >
        {saving ? "Creating your dashboard…" : "Create my dashboard"}
        {!saving && <ArrowRight aria-hidden="true" size={16} />}
      </button>
    </form>
  );
}
