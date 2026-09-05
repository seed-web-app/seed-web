"use client";

import Link from "next/link";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  ExternalLink,
  FileCode2,
  Laptop,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  Monitor,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Rocket,
  Settings,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  X,
  type LucideIcon,
} from "lucide-react";
import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";

import { signOut } from "@/app/auth/actions";
import type { DashboardContext } from "@/lib/dashboard-context";

type Identity = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  demo: boolean;
};

type ProviderId = "github" | "supabase" | "vercel" | "openai";
type ConnectionStatus = "Not connected" | "Connecting" | "Connected" | "Needs attention";
type Connection = {
  id: ProviderId;
  label: string;
  description: string;
  icon: LucideIcon;
  status: ConnectionStatus;
};
type PlanStep = { title: string; kind: string };
type RunStep = { stepType: string; status: string; outputSummary: string | null; errorMessage: string | null };
type RunStatus = {
  run: { id: string; status: string; createdAt: string; completedAt: string | null };
  steps: RunStep[];
  previewUrl: string | null;
  productionUrl: string | null;
};
type ChatMessage = { id: string; sender: string; content: string; createdAt?: string };
type WorkspaceView = "builder" | "settings";
type MobilePane = "chat" | "preview";
type PreviewDevice = "desktop" | "tablet" | "mobile";

const providerCatalog: Omit<Connection, "status">[] = [
  { id: "github", label: "GitHub", description: "Your source code and version history", icon: FileCode2 },
  { id: "supabase", label: "Supabase", description: "Your database, authentication and storage", icon: Code2 },
  { id: "vercel", label: "Vercel", description: "Your hosting and live website", icon: Cloud },
  { id: "openai", label: "Seed AI", description: "Your private AI connection", icon: Sparkles },
];
const coreProviders: ProviderId[] = ["github", "supabase", "vercel"];

const stepLabels: Record<string, string> = {
  inspect: "Understanding your project",
  generate_files: "Creating your pages",
  guard: "Checking everything is safe",
  github_repo: "Preparing your project files",
  github_push: "Saving your changes",
  supabase_project: "Setting up your database",
  supabase_migrate: "Preparing your app data",
  vercel_project: "Preparing hosting",
  vercel_env: "Connecting your services",
  vercel_deploy: "Deploying your app",
  verify_preview: "Testing your preview",
  record_snapshot: "Saving this version",
};

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function projectStatus(context: DashboardContext) {
  if (context.productionUrl) return "Live";
  if (context.previewUrl) return "Preview ready";
  if (context.projectStatus === "building") return "Building";
  return "Draft";
}

export function SeedBuilderWorkspace({ identity, context }: { identity: Identity; context: DashboardContext }) {
  const [view, setView] = useState<WorkspaceView>("builder");
  const [mobilePane, setMobilePane] = useState<MobilePane>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>(() => providerCatalog.map((provider) => ({
    ...provider,
    status: context.connections[provider.id] ?? "Not connected",
  })));
  const [connectionModal, setConnectionModal] = useState<Connection | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [notice, setNotice] = useState<string | null>(identity.demo ? "Local demo mode is active." : null);
  const [request, setRequest] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [plan, setPlan] = useState<PlanStep[] | null>(null);
  const [planning, setPlanning] = useState(false);
  const [pendingRunId, setPendingRunId] = useState<string | null>(
    context.recentRuns.find((run) => run.status === "waiting_for_user" || run.status === "running")?.id ?? null,
  );
  const [runStatus, setRunStatus] = useState<RunStatus | null>(null);
  const [approving, setApproving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [previewVersion, setPreviewVersion] = useState(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const getConnection = (id: ProviderId) => connections.find((connection) => connection.id === id);
  const coreReady = coreProviders.every((id) => getConnection(id)?.status === "Connected");
  const aiReady = getConnection("openai")?.status === "Connected";
  const activePreviewUrl = runStatus?.productionUrl ?? runStatus?.previewUrl ?? context.productionUrl ?? context.previewUrl ?? context.websiteUrl;
  const isRunning = runStatus?.run.status === "running";
  const previewReady = runStatus?.run.status === "waiting_for_user" && Boolean(runStatus.previewUrl);

  const pollRun = useCallback(async () => {
    if (!pendingRunId || !context.projectId) return;
    const response = await fetch(`/api/seed/run-status?runId=${encodeURIComponent(pendingRunId)}&projectId=${encodeURIComponent(context.projectId)}`);
    if (!response.ok) return;
    const data = await response.json() as RunStatus;
    setRunStatus(data);
    if (data.previewUrl || data.productionUrl) setPreviewVersion((value) => value + 1);
  }, [context.projectId, pendingRunId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/chat?projectId=${encodeURIComponent(context.projectId)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active || !data?.messages) return;
        setMessages(data.messages);
        if (data.messages.length === 0) {
          const key = `seed:new-project-prompt:${context.projectId}`;
          const initialPrompt = sessionStorage.getItem(key);
          if (initialPrompt) {
            setRequest(initialPrompt);
            sessionStorage.removeItem(key);
          }
        }
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoadingMessages(false); });
    return () => { active = false; };
  }, [context.projectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, planning, runStatus]);

  useEffect(() => {
    if (!pendingRunId) return;
    const timeout = window.setTimeout(() => { void pollRun(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [pendingRunId, pollRun]);

  useEffect(() => {
    if (!pendingRunId || !isRunning) return;
    const interval = window.setInterval(() => { void pollRun(); }, 3_000);
    return () => window.clearInterval(interval);
  }, [isRunning, pendingRunId, pollRun]);

  async function connect(connection: Connection, event?: FormEvent) {
    event?.preventDefault();
    const previousStatus = connection.status;
    setConnections((items) => items.map((item) => item.id === connection.id ? { ...item, status: "Connecting" } : item));
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: connection.id,
          workspaceId: context.demo ? undefined : context.workspaceId,
          projectId: context.projectId || undefined,
          ...(connection.id === "openai" && apiKey ? { credential: apiKey } : {}),
        }),
      });
      const data = await response.json() as { message?: string; configured?: boolean; authorizationUrl?: string | null };
      if (!response.ok) throw new Error(data.message ?? "Seed could not start that connection.");
      setApiKey("");
      setConnectionModal(null);
      setConnections((items) => items.map((item) => item.id === connection.id ? { ...item, status: data.configured ? "Connected" : "Connecting" } : item));
      setNotice(data.message ?? "Connection setup started.");
      if (data.authorizationUrl) window.location.assign(data.authorizationUrl);
    } catch (error) {
      setConnections((items) => items.map((item) => item.id === connection.id ? { ...item, status: previousStatus } : item));
      setNotice(error instanceof Error ? error.message : "Seed could not reach the connection service.");
    }
  }

  async function disconnect(connection: Connection) {
    const response = await fetch("/api/connections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: connection.id, workspaceId: context.workspaceId }),
    });
    const data = await response.json() as { message?: string };
    if (!response.ok) {
      setNotice(data.message ?? "Seed could not disconnect that service.");
      return;
    }
    setConnections((items) => items.map((item) => item.id === connection.id ? { ...item, status: "Not connected" } : item));
    setNotice(`${connection.label} disconnected.`);
  }

  async function sendRequest(event?: FormEvent) {
    event?.preventDefault();
    const text = request.trim();
    if (!text || !aiReady || sending) return;
    const optimisticId = `local-${Date.now()}`;
    setMessages((items) => [...items, { id: optimisticId, sender: "user", content: text }]);
    setRequest("");
    setSending(true);
    setPlanning(true);
    setPlan(null);
    setRunStatus(null);
    setPendingRunId(null);

    const [chatResult, planResult] = await Promise.allSettled([
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: context.projectId, message: text }),
      }),
      fetch("/api/seed/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: context.projectId, request: text }),
      }),
    ]);

    if (chatResult.status === "fulfilled") {
      const data = await chatResult.value.json() as { message?: ChatMessage };
      if (chatResult.value.ok && data.message) setMessages((items) => [...items, data.message!]);
    }
    if (planResult.status === "fulfilled") {
      const data = await planResult.value.json() as { message?: string; runId?: string; plan?: { steps: PlanStep[] } };
      if (planResult.value.ok && data.plan) {
        setPlan(data.plan.steps);
        setPendingRunId(data.runId ?? null);
      } else {
        setNotice(data.message ?? "Seed could not prepare the build plan.");
      }
    } else {
      setNotice("Seed could not prepare the build plan. Please try again.");
    }
    setSending(false);
    setPlanning(false);
  }

  async function approve() {
    if (!pendingRunId || approving) return;
    setApproving(true);
    const response = await fetch("/api/seed/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: pendingRunId, projectId: context.projectId }),
    });
    const data = await response.json() as { message?: string };
    if (!response.ok) setNotice(data.message ?? "Seed could not start this build.");
    else {
      setRunStatus({ run: { id: pendingRunId, status: "running", createdAt: new Date().toISOString(), completedAt: null }, steps: [], previewUrl: null, productionUrl: null });
      setMobilePane("preview");
      void pollRun();
    }
    setApproving(false);
  }

  async function publish() {
    if (!pendingRunId || publishing) return;
    setPublishing(true);
    const response = await fetch("/api/seed/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: pendingRunId, projectId: context.projectId }),
    });
    const data = await response.json() as { message?: string };
    setNotice(data.message ?? (response.ok ? "Publishing started." : "Seed could not publish this version."));
    if (response.ok) void pollRun();
    setPublishing(false);
  }

  async function sharePreview() {
    if (!activePreviewUrl) return;
    await navigator.clipboard.writeText(activePreviewUrl);
    setNotice("Preview link copied.");
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendRequest();
    }
  }

  return (
    <div className="seed-studio-shell">
      {sidebarOpen ? <button className="seed-sidebar-scrim" aria-label="Close projects" onClick={() => setSidebarOpen(false)} /> : null}
      <aside className={`seed-studio-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="seed-sidebar-brand"><Link className="brand" href="/">seed<span>.</span></Link><button aria-label="Close projects" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
        <Link className="seed-new-project" href="/onboarding"><Plus size={16} /> New project</Link>
        <p className="seed-sidebar-label">Projects</p>
        <nav className="seed-project-list" aria-label="Projects">
          {context.projects.map((project) => (
            <Link className={project.id === context.projectId ? "active" : ""} href={`/dashboard?project=${project.id}`} key={project.id}>
              <span>{project.name.slice(0, 1).toUpperCase()}</span><b>{project.name}</b>{project.websiteUrl ? <i aria-label="Deployed" /> : null}
            </Link>
          ))}
        </nav>
        <div className="seed-sidebar-footer">
          <button className={view === "settings" ? "active" : ""} onClick={() => { setView("settings"); setSidebarOpen(false); }}><Settings size={16} /> Settings</button>
          <div className="seed-account"><span>{initials(identity.name)}</span><div><b>{identity.name}</b><small>{context.workspaceName}</small></div>{!identity.demo ? <form action={signOut}><button type="submit" aria-label="Sign out"><LogOut size={15} /></button></form> : null}</div>
        </div>
      </aside>

      <main className="seed-studio-main">
        <header className="seed-builder-topbar">
          <button className="seed-menu-button" aria-label="Open projects" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>
          <button className="seed-project-title" onClick={() => setView("builder")}><span>{context.projectName}</span><small><i /> {projectStatus(context)}</small></button>
          {view === "builder" ? <div className="seed-mobile-switch" role="tablist"><button className={mobilePane === "chat" ? "active" : ""} onClick={() => setMobilePane("chat")}>Chat</button><button className={mobilePane === "preview" ? "active" : ""} onClick={() => setMobilePane("preview")}>Preview</button></div> : null}
          <div className="seed-topbar-actions">
            {view === "settings" ? <button className="seed-quiet-button" onClick={() => setView("builder")}>Back to builder</button> : <>
              <button className="seed-icon-button" aria-label="Copy preview link" disabled={!activePreviewUrl} onClick={() => { void sharePreview(); }}><Share2 size={16} /><span>Share</span></button>
              {previewReady ? <button className="seed-publish-button" disabled={publishing} onClick={() => { void publish(); }}>{publishing ? <LoaderCircle className="spin" size={16} /> : <Rocket size={16} />} Publish</button> : context.productionUrl ? <a className="seed-publish-button" href={context.productionUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open live</a> : null}
            </>}
          </div>
        </header>

        {view === "settings" ? (
          <ConnectedServices context={context} connections={connections} open={setConnectionModal} disconnect={disconnect} />
        ) : !coreReady ? (
          <ConnectStack connections={connections} open={setConnectionModal} />
        ) : (
          <section className="seed-builder-workspace">
            <div className={`seed-chat-column ${mobilePane === "chat" ? "mobile-active" : ""}`}>
              <header className="seed-pane-heading"><div className="seed-ai-orb"><Sparkles size={16} /></div><div><b>Seed</b><small>{isRunning ? "Building your app…" : "Ready to build with you"}</small></div></header>
              <div className="seed-conversation" aria-live="polite">
                {loadingMessages ? <div className="seed-thinking"><LoaderCircle className="spin" size={16} /> Loading your project conversation…</div> : null}
                {!loadingMessages && messages.length === 0 ? <ChatWelcome name={identity.name.split(" ")[0]} setRequest={setRequest} /> : null}
                {messages.map((message) => <ChatBubble message={message} key={message.id} />)}
                {sending ? <div className="seed-thinking"><span className="seed-dot-pulse" /> Seed is thinking…</div> : null}
                {planning || plan || runStatus ? <BuildCard planning={planning} plan={plan} runStatus={runStatus} pendingRunId={pendingRunId} approving={approving} approve={approve} previewReady={previewReady} publish={publish} publishing={publishing} /> : null}
                <div ref={chatEndRef} />
              </div>
              {!aiReady ? <div className="seed-ai-required"><LockKeyhole size={17} /><div><b>Connect Seed AI to start building</b><small>Your OpenAI key stays encrypted.</small></div><button onClick={() => setConnectionModal(getConnection("openai") ?? null)}>Connect</button></div> : null}
              <form className="seed-composer" onSubmit={sendRequest}>
                <textarea rows={3} value={request} disabled={!aiReady} onKeyDown={handleComposerKeyDown} onChange={(event) => setRequest(event.target.value)} placeholder="What do you want to build or change?" />
                <footer><span><ShieldCheck size={13} /> Seed checks changes before building</span><button aria-label="Send to Seed" disabled={!aiReady || sending || !request.trim()}><ArrowUp size={18} /></button></footer>
              </form>
            </div>

            <div className={`seed-preview-column ${mobilePane === "preview" ? "mobile-active" : ""}`}>
              <header className="seed-preview-toolbar">
                <div className="seed-device-picker" aria-label="Preview size">
                  <button aria-label="Desktop preview" className={previewDevice === "desktop" ? "active" : ""} onClick={() => setPreviewDevice("desktop")}><Monitor size={16} /></button>
                  <button aria-label="Tablet preview" className={previewDevice === "tablet" ? "active" : ""} onClick={() => setPreviewDevice("tablet")}><Tablet size={16} /></button>
                  <button aria-label="Mobile preview" className={previewDevice === "mobile" ? "active" : ""} onClick={() => setPreviewDevice("mobile")}><Smartphone size={16} /></button>
                </div>
                <div className="seed-preview-url"><LockKeyhole size={12} /><span>{activePreviewUrl ?? "Your preview will appear here"}</span></div>
                <button className="seed-toolbar-button" aria-label="Refresh preview" disabled={!activePreviewUrl} onClick={() => setPreviewVersion((value) => value + 1)}><RefreshCw size={15} /></button>
                {activePreviewUrl ? <a className="seed-toolbar-button" aria-label="Open preview in new tab" href={activePreviewUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a> : null}
                <button className="seed-toolbar-button seed-more-button" aria-label="Preview options"><MoreHorizontal size={16} /></button>
              </header>
              <div className={`seed-preview-stage device-${previewDevice}`}>
                {activePreviewUrl ? <iframe key={`${activePreviewUrl}-${previewVersion}`} title={`${context.projectName} preview`} src={activePreviewUrl} referrerPolicy="strict-origin-when-cross-origin" /> : <PreviewEmpty projectName={context.projectName} />}
                {isRunning ? <div className="seed-building-overlay"><LoaderCircle className="spin" size={18} /><span>Building your app…</span><small>The preview refreshes when it is ready.</small></div> : null}
              </div>
            </div>
          </section>
        )}
      </main>

      {connectionModal ? <ConnectionDialog connection={connectionModal} apiKey={apiKey} setApiKey={setApiKey} close={() => setConnectionModal(null)} connect={connect} /> : null}
      {notice ? <button className="seed-toast" onClick={() => setNotice(null)}><Check size={15} /><span>{notice}</span><X size={14} /></button> : null}
    </div>
  );
}

function ChatWelcome({ name, setRequest }: { name: string; setRequest: (value: string) => void }) {
  return <div className="seed-chat-welcome"><span><Sparkles size={20} /></span><h1>What should we build, {name}?</h1><p>Describe your idea in plain language. Seed will plan it, build it safely, and show the result beside our conversation.</p><div><button onClick={() => setRequest("Create a premium yoga studio booking website")}>Yoga studio</button><button onClick={() => setRequest("Create a modern portfolio website")}>Portfolio</button><button onClick={() => setRequest("Make my landing page feel more premium")}>Improve design</button></div></div>;
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user";
  return <article className={`seed-message ${isUser ? "user" : "seed"}`}>{!isUser ? <span className="seed-message-mark"><Sparkles size={13} /></span> : null}<div><b>{isUser ? "You" : "Seed"}</b><p>{message.content}</p></div></article>;
}

function BuildCard({ planning, plan, runStatus, pendingRunId, approving, approve, previewReady, publish, publishing }: { planning: boolean; plan: PlanStep[] | null; runStatus: RunStatus | null; pendingRunId: string | null; approving: boolean; approve: () => Promise<void>; previewReady: boolean; publish: () => Promise<void>; publishing: boolean }) {
  if (planning) return <div className="seed-build-card"><div className="seed-card-title"><LoaderCircle className="spin" size={16} /><b>Preparing your build plan…</b></div><p>Seed is reading your project and choosing the safest changes.</p></div>;
  if (runStatus) return <div className="seed-build-card"><div className="seed-card-title"><span className={`seed-status-dot ${runStatus.run.status}`} /><b>{runStatus.run.status === "running" ? "Building your app…" : previewReady ? "Your preview is ready" : runStatus.run.status === "failed" ? "This build needs attention" : "Build complete"}</b></div><div className="seed-progress-list">{runStatus.steps.filter((step) => stepLabels[step.stepType]).map((step) => <div className={step.status} key={step.stepType}><i>{step.status === "completed" ? <Check size={11} /> : step.status === "running" ? <LoaderCircle className="spin" size={11} /> : step.status === "failed" ? <X size={11} /> : null}</i><span>{stepLabels[step.stepType]}</span>{step.errorMessage ? <small>{step.errorMessage}</small> : null}</div>)}</div>{previewReady ? <button className="seed-card-action" onClick={() => { void publish(); }} disabled={publishing}>{publishing ? "Publishing…" : "Publish this version"}<Rocket size={14} /></button> : null}</div>;
  if (!plan) return null;
  return <div className="seed-build-card"><div className="seed-card-title"><Sparkles size={15} /><b>Build plan ready</b></div><p>Seed will make these changes after your approval.</p><ol>{plan.map((step) => <li key={`${step.kind}-${step.title}`}>{step.title}</li>)}</ol><button className="seed-card-action" disabled={!pendingRunId || approving} onClick={() => { void approve(); }}>{approving ? "Starting build…" : "Approve and build preview"}<ArrowUp size={14} /></button><small className="seed-guard-note"><ShieldCheck size={12} /> Only approved changes will be written.</small></div>;
}

function PreviewEmpty({ projectName }: { projectName: string }) {
  return <div className="seed-preview-empty"><div className="seed-empty-browser"><div><i /><i /><i /></div><span><Laptop size={38} /></span></div><h2>Your live preview will appear here</h2><p>Ask Seed to build or change {projectName}. You can watch the result here without opening technical tools.</p></div>;
}

function ConnectStack({ connections, open }: { connections: Connection[]; open: (connection: Connection) => void }) {
  return <section className="seed-connect-screen"><div className="seed-connect-intro"><span><Sparkles size={21} /></span><p className="seed-kicker">One-time setup</p><h1>Connect your development stack</h1><p>Connect your accounts once. Seed will handle the project files, database, and hosting while you stay in control.</p></div><div className="seed-stack-list">{connections.filter((item) => coreProviders.includes(item.id)).map((connection) => <article key={connection.id}><span><connection.icon size={21} /></span><div><h2>{connection.label}</h2><p>{connection.description}</p></div>{connection.status === "Connected" ? <b><Check size={14} /> Connected</b> : <button onClick={() => open(connection)}>{connection.status === "Needs attention" ? "Reconnect" : "Connect"}<ExternalLink size={13} /></button>}</article>)}</div><p className="seed-ownership-note"><ShieldCheck size={15} /> These accounts and everything Seed creates in them remain yours.</p></section>;
}

function ConnectedServices({ context, connections, open, disconnect }: { context: DashboardContext; connections: Connection[]; open: (connection: Connection) => void; disconnect: (connection: Connection) => Promise<void> }) {
  const links: Partial<Record<ProviderId, string | null>> = { github: context.resourceLinks.github, supabase: context.resourceLinks.supabase, vercel: context.resourceLinks.vercel };
  return <section className="seed-settings-screen"><div className="seed-settings-heading"><p className="seed-kicker">Project settings</p><h1>Connected services</h1><p>Seed works inside accounts you own. Connect once, reconnect when access changes, or disconnect at any time.</p></div><div className="seed-service-list">{connections.map((connection) => <article key={connection.id}><span className="seed-service-icon"><connection.icon size={20} /></span><div><h2>{connection.label}</h2><p>{connection.description}</p>{connection.status === "Connected" ? <small><i /> Connected</small> : <small className="attention">{connection.status}</small>}</div><div>{links[connection.id] ? <a href={links[connection.id]!} target="_blank" rel="noreferrer">Open <ExternalLink size={13} /></a> : null}<button onClick={() => open(connection)}>{connection.status === "Not connected" ? "Connect" : "Reconnect"}</button>{connection.status !== "Not connected" ? <button className="danger" onClick={() => { void disconnect(connection); }}>Disconnect</button> : null}</div></article>)}</div><details className="seed-developer-details"><summary>Developer details <ChevronDown size={15} /></summary><dl><div><dt>Latest commit</dt><dd>{context.latestCommitSha?.slice(0, 8) ?? "No commit yet"}</dd></div><div><dt>Project status</dt><dd>{projectStatus(context)}</dd></div><div><dt>Preview</dt><dd>{context.previewUrl ?? "No preview yet"}</dd></div><div><dt>Production</dt><dd>{context.productionUrl ?? "Not published"}</dd></div></dl></details></section>;
}

function ConnectionDialog({ connection, apiKey, setApiKey, close, connect }: { connection: Connection; apiKey: string; setApiKey: (value: string) => void; close: () => void; connect: (connection: Connection, event?: FormEvent) => Promise<void> }) {
  const isOpenAi = connection.id === "openai";
  return <div className="seed-dialog-backdrop" onMouseDown={close}><form className="seed-dialog" onSubmit={(event) => { void connect(connection, event); }} onMouseDown={(event) => event.stopPropagation()}><button className="seed-dialog-close" type="button" onClick={close} aria-label="Close"><X size={18} /></button><span className="seed-dialog-icon"><connection.icon size={22} /></span><p className="seed-kicker">{connection.label}</p><h2>{isOpenAi ? "Connect Seed AI" : `Connect ${connection.label}`}</h2><p>{isOpenAi ? "Add your OpenAI API key. Seed validates and encrypts it on the server; it is never returned to your browser." : "You will continue to the official authorization page. Seed never asks for your provider password."}</p>{isOpenAi ? <label>OpenAI API key<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-…" autoComplete="off" required /></label> : null}<button className="seed-dialog-primary" type="submit">{connection.status === "Needs attention" ? "Reconnect and approve" : isOpenAi ? "Validate and connect" : "Continue to authorize"}<ExternalLink size={14} /></button><small><ShieldCheck size={12} /> Your infrastructure remains yours.</small></form></div>;
}
