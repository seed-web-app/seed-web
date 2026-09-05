"use client";

import Link from "next/link";
import { ArrowRight, Check, Cloud, Code2, ExternalLink, FileCode2, LoaderCircle, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { DashboardContext } from "@/lib/dashboard-context";

type CoreProvider = "github" | "supabase" | "vercel";
type Status = "Not connected" | "Connecting" | "Connected" | "Needs attention";
const providers = [
  { id: "github" as const, name: "GitHub", description: "Your source code", icon: FileCode2 },
  { id: "supabase" as const, name: "Supabase", description: "Database + authentication", icon: Code2 },
  { id: "vercel" as const, name: "Vercel", description: "Hosting + deployment", icon: Cloud },
];
const ideas = [
  ["CRM", "Create a simple CRM for my company"],
  ["Portfolio", "Create a premium portfolio website"],
  ["SaaS", "Create a modern SaaS application"],
  ["Booking app", "Create a polished booking website"],
  ["Yoga", "Create a premium yoga studio booking website"],
  ["Landing page", "Create a high-converting landing page"],
] as const;

function inferProjectType(idea: string): "business_website" | "lead_website" | "booking_website" {
  if (/\b(?:book|booking|reserve|appointment|class)\b/i.test(idea)) return "booking_website";
  if (/\b(?:lead|contact|enquir|inquiry)\b/i.test(idea)) return "lead_website";
  return "business_website";
}

function inferProjectName(idea: string) {
  const explicit = idea.match(/(?:called|named|for)\s+["']?([\p{L}\p{N}][\p{L}\p{N} &'-]{1,48})["']?/iu)?.[1]
    ?.replace(/\s+(?:website|web app|app)$/i, "").trim();
  if (explicit) return explicit;
  if (/yoga/i.test(idea)) return "Yoga Studio";
  if (/portfolio/i.test(idea)) return "My Portfolio";
  if (/crm/i.test(idea)) return "My CRM";
  if (/saas/i.test(idea)) return "My SaaS";
  if (/booking/i.test(idea)) return "Booking App";
  const words = idea.replace(/^(?:please\s+)?(?:create|build|make)\s+(?:me\s+)?/i, "").trim().split(/\s+/).slice(0, 5).join(" ");
  return words.length >= 2 ? words.slice(0, 120) : "My Seed Project";
}

export function OnboardingFlow({ name, context }: { name: string; context: DashboardContext }) {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<CoreProvider, Status>>({
    github: context.connections.github ?? "Not connected",
    supabase: context.connections.supabase ?? "Not connected",
    vercel: context.connections.vercel ?? "Not connected",
  });
  const ready = providers.every((provider) => statuses[provider.id] === "Connected");

  async function connect(provider: CoreProvider) {
    const previous = statuses[provider];
    setStatuses((current) => ({ ...current, [provider]: "Connecting" }));
    setError(null);
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, workspaceId: context.workspaceId }),
      });
      const data = await response.json() as { message?: string; configured?: boolean; authorizationUrl?: string | null };
      if (!response.ok) throw new Error(data.message ?? "Seed could not start this connection.");
      setStatuses((current) => ({ ...current, [provider]: data.configured ? "Connected" : "Connecting" }));
      if (data.authorizationUrl) window.location.assign(data.authorizationUrl);
    } catch (connectionError) {
      setStatuses((current) => ({ ...current, [provider]: previous }));
      setError(connectionError instanceof Error ? connectionError.message : "Seed could not connect that service.");
    }
  }

  async function createProject(event: FormEvent) {
    event.preventDefault();
    const request = idea.trim();
    if (request.length < 3 || creating) return;
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inferProjectName(request),
          projectType: inferProjectType(request),
          features: [`Initial idea: ${request}`.slice(0, 80)],
        }),
      });
      const data = await response.json() as { message?: string; project?: { id: string } };
      if (!response.ok || !data.project?.id) throw new Error(data.message ?? "Seed could not create your project.");
      sessionStorage.setItem(`seed:new-project-prompt:${data.project.id}`, request);
      router.push(`/dashboard?project=${encodeURIComponent(data.project.id)}`);
      router.refresh();
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : "Seed could not create your project.");
      setCreating(false);
    }
  }

  return <main className="seed-onboarding-v2">
    <header><Link className="brand" href="/">seed<span>.</span></Link>{context.projects.length ? <Link href={`/dashboard?project=${context.projects[0].id}`}>Back to projects</Link> : <span>Your accounts stay yours</span>}</header>
    {!ready ? <section className="seed-onboarding-stack"><div className="seed-onboarding-heading"><span><Sparkles size={20} /></span><p>Hi {name.split(" ")[0]}</p><h1>Connect your development stack</h1><small>Connect your accounts once and Seed will handle the rest.</small></div><div className="seed-onboarding-providers">{providers.map((provider) => <article key={provider.id}><span><provider.icon size={21} /></span><div><b>{provider.name}</b><small>{provider.description}</small></div>{statuses[provider.id] === "Connected" ? <strong><Check size={14} /> Connected</strong> : <button onClick={() => { void connect(provider.id); }} disabled={statuses[provider.id] === "Connecting"}>{statuses[provider.id] === "Connecting" ? <LoaderCircle className="spin" size={14} /> : null}{statuses[provider.id] === "Needs attention" ? "Reconnect" : "Connect"}<ExternalLink size={12} /></button>}</article>)}</div>{error ? <p className="seed-onboarding-error" role="alert">{error}</p> : null}<p className="seed-onboarding-owner">GitHub, Supabase, Vercel, and every app Seed creates remain yours.</p></section> : <section className="seed-idea-screen"><div className="seed-idea-mark"><Sparkles size={22} /></div><p>New project</p><h1>What do you want to build?</h1><small>Describe your idea in plain language. You can keep chatting with Seed after the first version.</small><form onSubmit={createProject}><textarea autoFocus rows={5} value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Describe your idea…" /><button disabled={creating || idea.trim().length < 3}>{creating ? <LoaderCircle className="spin" size={17} /> : null}{creating ? "Creating project…" : "Build with Seed"}<ArrowRight size={16} /></button></form><div className="seed-idea-chips">{ideas.map(([label, prompt]) => <button key={label} onClick={() => setIdea(prompt)}>{label}</button>)}</div>{error ? <p className="seed-onboarding-error" role="alert">{error}</p> : null}</section>}
  </main>;
}
