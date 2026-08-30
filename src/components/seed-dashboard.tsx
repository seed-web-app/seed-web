"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  Check,
  Cloud,
  ContactRound,
  ExternalLink,
  FileCode2,
  FolderKanban,
  Globe2,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  PanelLeftClose,
  Plus,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { signOut } from "@/app/auth/actions";
import type {
  DashboardContext,
  DashboardProject,
  DashboardRun,
  ProjectStatus,
} from "@/lib/dashboard-context";

type Identity = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  demo: boolean;
};

type View =
  | "home"
  | "projects"
  | "overview"
  | "website"
  | "customers"
  | "bookings"
  | "media"
  | "ask"
  | "settings";

type Connection = {
  id: "github" | "supabase" | "vercel" | "openai";
  label: string;
  detail: string;
  status: "Not connected" | "Connecting" | "Connected" | "Needs attention";
  icon: LucideIcon;
};

type PlanStep = { title: string; kind: string };

type RunStep = {
  stepType: string;
  status: string;
  outputSummary: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

type RunStatus = {
  run: { id: string; status: string; createdAt: string; completedAt: string | null };
  steps: RunStep[];
  previewUrl: string | null;
  productionUrl: string | null;
};

const mainNav: [View, string, LucideIcon][] = [
  ["home", "Home", Home],
  ["projects", "Projects", FolderKanban],
];

const projectNav: [View, string, LucideIcon][] = [
  ["overview", "Overview", LayoutDashboard],
  ["website", "Website", Globe2],
  ["customers", "Customers", Users],
  ["bookings", "Bookings", CalendarDays],
  ["media", "Media", ImageIcon],
];

const bottomNav: [View, string, LucideIcon][] = [
  ["ask", "Ask Seed", Sparkles],
  ["settings", "Settings", Settings],
];

const connectionCatalog: Connection[] = [
  {
    id: "github",
    label: "Project files",
    detail: "Powered by GitHub",
    status: "Not connected",
    icon: FileCode2,
  },
  {
    id: "supabase",
    label: "Database",
    detail: "Powered by Supabase",
    status: "Not connected",
    icon: Building2,
  },
  {
    id: "vercel",
    label: "Hosting",
    detail: "Powered by Vercel",
    status: "Not connected",
    icon: Cloud,
  },
  {
    id: "openai",
    label: "Seed AI",
    detail: "Uses your OpenAI account",
    status: "Not connected",
    icon: Bot,
  },
];

function statusLabel(status: ProjectStatus) {
  return status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function projectTypeLabel(projectType: string) {
  return projectType.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function formatTimestamp(value: string) {
  return `${new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

function statusClass(status: ProjectStatus) {
  if (status === "live") return "live";
  if (status === "needs_attention" || status === "building") return "warning";
  return "idle";
}

export function SeedDashboard({
  identity,
  context,
}: {
  identity: Identity;
  context: DashboardContext;
}) {
  const [view, setView] = useState<View>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connections, setConnections] = useState(
    connectionCatalog.map(
      (connection) =>
        ({
          ...connection,
          status: context.connections[connection.id] ?? "Not connected",
        }) as Connection,
    ),
  );
  const [connectionModal, setConnectionModal] = useState<Connection | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [notice, setNotice] = useState<string | null>(
    identity.demo ? "Demo mode is on. Changes are not persisted." : null,
  );
  const [request, setRequest] = useState("");
  const [plan, setPlan] = useState<PlanStep[] | null>(null);
  const [planning, setPlanning] = useState(false);
  const [pendingRunId, setPendingRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus | null>(null);

  const projectName = context.projectName || "No project selected";
  const openAiConnected =
    connections.find((connection) => connection.id === "openai")?.status === "Connected";

  const navigate = (target: View) => {
    setView(target);
    setSidebarOpen(false);
  };

  async function connect(connection: Connection, event?: FormEvent) {
    event?.preventDefault();
    const previousStatus = connection.status;
    setConnections((items) =>
      items.map((item) =>
        item.id === connection.id ? { ...item, status: "Connecting" } : item,
      ),
    );

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
      const data = (await response.json()) as {
        message?: string;
        configured?: boolean;
        authorizationUrl?: string | null;
      };

      if (!response.ok) {
        setConnections((items) =>
          items.map((item) =>
            item.id === connection.id ? { ...item, status: previousStatus } : item,
          ),
        );
        setNotice(data.message ?? "Seed could not start that connection.");
        return;
      }

      setApiKey("");
      setConnectionModal(null);
      setConnections((items) =>
        items.map((item) =>
          item.id === connection.id
            ? { ...item, status: data.configured ? "Connected" : "Connecting" }
            : item,
        ),
      );
      setNotice(data.message ?? "Connection setup started.");
      if (data.authorizationUrl) window.location.assign(data.authorizationUrl);
    } catch {
      setConnections((items) =>
        items.map((item) =>
          item.id === connection.id ? { ...item, status: previousStatus } : item,
        ),
      );
      setNotice("Seed could not reach the connection service. Please try again.");
    }
  }

  async function disconnect(connection: Connection) {
    if (context.demo) {
      setConnections((items) =>
        items.map((item) =>
          item.id === connection.id ? { ...item, status: "Not connected" } : item,
        ),
      );
      setNotice(`${connection.label} disconnected.`);
      return;
    }

    try {
      const response = await fetch("/api/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: connection.id,
          workspaceId: context.workspaceId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.message ?? "Could not disconnect provider.");
        return;
      }
      setConnections((items) =>
        items.map((item) =>
          item.id === connection.id ? { ...item, status: "Not connected" } : item,
        ),
      );
      setNotice(`${connection.label} was disconnected.`);
    } catch {
      setNotice("Seed could not reach the server to disconnect.");
    }
  }

  async function askSeed(event: FormEvent) {
    event.preventDefault();
    if (!request.trim() || !openAiConnected) return;
    setPlanning(true);
    setPlan(null);
    setPendingRunId(null);
    setRunStatus(null);

    try {
      const response = await fetch("/api/seed/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, projectId: context.projectId }),
      });
      const data = (await response.json()) as {
        message?: string;
        runId?: string;
        plan?: { steps: PlanStep[] };
      };

      if (!response.ok || !data.plan) {
        setNotice(data.message ?? "Seed could not prepare that plan.");
        return;
      }

      setPlan(data.plan.steps);
      if (data.runId) setPendingRunId(data.runId);
      setNotice(data.message ?? "Your safe build plan is ready.");
    } catch {
      setNotice("Seed AI could not be reached. Please try again.");
    } finally {
      setPlanning(false);
    }
  }

  function navItem([id, label, Icon]: [View, string, LucideIcon]) {
    return (
      <button
        className={`app-nav-item ${view === id ? "active" : ""}`}
        onClick={() => navigate(id)}
        key={id}
      >
        <Icon size={17} />
        <span>{label}</span>
        {id === "bookings" && context.counts.bookings > 0 && (
          <b>{context.counts.bookings}</b>
        )}
      </button>
    );
  }

  return (
    <div className="app-shell">
      <button
        className="mobile-menu"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu />
      </button>
      {sidebarOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}
      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <Link className="brand" href="/">
            seed<span>.</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <PanelLeftClose size={18} />
          </button>
        </div>
        <div className="app-nav">
          <p>Workspace</p>
          {mainNav.map(navItem)}
          <p>{projectName}</p>
          {projectNav.map(navItem)}
          <div className="nav-spacer" />
          {bottomNav.map(navItem)}
        </div>
        <div className="user-chip">
          <div className="avatar">
            {identity.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <span>
            <b>{identity.name}</b>
            <small>{identity.demo ? "Local demo" : context.workspaceName}</small>
          </span>
          {!identity.demo && (
            <form action={signOut}>
              <button className="sign-out" type="submit" aria-label="Sign out">
                <LogOut size={15} />
              </button>
            </form>
          )}
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div>
            <span className="muted">Projects</span>
            <span className="slash">/</span>
            <b>{projectName}</b>
          </div>
          <div className="top-actions">
            <span className={`environment ${identity.demo ? "demo" : "live"}`}>
              {identity.demo ? "Demo" : "Live"}
            </span>
          </div>
        </header>

        {view === "home" && (
          <HomeView
            identity={identity}
            context={context}
            connections={connections}
            navigate={navigate}
            setRequest={setRequest}
          />
        )}
        {view === "projects" && <ProjectsView context={context} />}
        {view === "overview" && <OverviewView context={context} navigate={navigate} />}
        {view === "website" && <WebsiteView context={context} navigate={navigate} />}
        {view === "customers" && (
          <EmptyDataView
            eyebrow={projectName}
            title="Customers"
            copy="Customer records will appear after the project database is connected."
            icon={Users}
            navigate={navigate}
          />
        )}
        {view === "bookings" && (
          <EmptyDataView
            eyebrow={projectName}
            title="Bookings"
            copy="Booking requests will appear after the booking database is connected."
            icon={CalendarDays}
            navigate={navigate}
          />
        )}
        {view === "media" && (
          <EmptyDataView
            eyebrow={projectName}
            title="Media"
            copy="Project images will appear after storage is connected."
            icon={ImageIcon}
            navigate={navigate}
          />
        )}
        {view === "ask" && (
          <AskView
            request={request}
            setRequest={setRequest}
            submit={askSeed}
            planning={planning}
            plan={plan}
            enabled={openAiConnected}
            navigate={navigate}
            pendingRunId={pendingRunId}
            projectId={context.projectId}
            workspaceId={context.workspaceId}
            runStatus={runStatus}
            setRunStatus={setRunStatus}
          />
        )}
        {view === "settings" && (
          <SettingsView
            connections={connections}
            open={setConnectionModal}
            disconnect={disconnect}
          />
        )}
      </main>

      {connectionModal && (
        <ConnectionModal
          connection={connectionModal}
          apiKey={apiKey}
          setApiKey={setApiKey}
          close={() => setConnectionModal(null)}
          connect={connect}
        />
      )}
      {notice && (
        <button className="notice" onClick={() => setNotice(null)}>
          <Check size={16} />
          {notice}
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function PageTitle({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action}
    </div>
  );
}

function HomeView({
  identity,
  context,
  connections,
  navigate,
  setRequest,
}: {
  identity: Identity;
  context: DashboardContext;
  connections: Connection[];
  navigate: (view: View) => void;
  setRequest: (value: string) => void;
}) {
  const connectedCount = connections.filter(
    (connection) => connection.status === "Connected",
  ).length;
  const quick = (value: string) => {
    setRequest(value);
    navigate("ask");
  };

  return (
    <>
      <PageTitle
        title={`Welcome, ${identity.name.split(" ")[0]}.`}
        copy={
          context.projectStatus === "live"
            ? "Your project is live. Seed is ready for the next approved change."
            : "Finish connecting your services, then ask Seed to prepare the first build."
        }
        action={
          <button className="primary-action" onClick={() => navigate("ask")}>
            <Sparkles size={16} /> Ask Seed
          </button>
        }
      />
      <section className="stats-grid">
        <Metric
          icon={Globe2}
          label="Website"
          value={statusLabel(context.projectStatus)}
          detail={context.websiteUrl ?? "Not published yet"}
          good={context.projectStatus === "live"}
        />
        <Metric
          icon={CalendarDays}
          label="Bookings"
          value={String(context.counts.bookings)}
          detail="No imported booking data"
        />
        <Metric
          icon={ContactRound}
          label="Customers"
          value={String(context.counts.customers)}
          detail="No imported customer data"
        />
        <Metric
          icon={Activity}
          label="Connections"
          value={`${connectedCount}/4`}
          detail={connectedCount === 4 ? "All services connected" : "Setup incomplete"}
          good={connectedCount === 4}
        />
      </section>
      <section className="home-grid">
        <article className="dark-panel">
          <span className="sparkle-orb">
            <Sparkles />
          </span>
          <h2>What would you like to build?</h2>
          <p>Describe it in simple language. Seed shows a safe plan before acting.</p>
          <div className="quick-prompts">
            <button onClick={() => quick("Build the first version of my website") }>
              Build the first version <ArrowRight size={15} />
            </button>
            <button onClick={() => quick("Add a contact form") }>
              Add a contact form <ArrowRight size={15} />
            </button>
            <button onClick={() => quick("Add booking requests") }>
              Add booking requests <ArrowRight size={15} />
            </button>
          </div>
        </article>
        <article className="panel activity-panel">
          <div className="panel-heading">
            <h3>Recent activity</h3>
          </div>
          <Timeline runs={context.recentRuns} />
        </article>
      </section>
      <section className="panel lower-panel">
        <div className="panel-heading">
          <div>
            <h3>Your setup</h3>
            <p>Connect each account once. Seed stores access securely.</p>
          </div>
          <button className="secondary-button" onClick={() => navigate("settings")}>
            Manage connections
          </button>
        </div>
        <div className="setup-row">
          {connections.map((connection) => (
            <Setup
              key={connection.id}
              icon={connection.icon}
              label={connection.label}
              status={connection.status}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  good,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  good?: boolean;
}) {
  return (
    <article className="metric panel">
      <div className="metric-icon">
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong className={good ? "good" : ""}>
        {good && <i />}
        {value}
      </strong>
      <small>{detail}</small>
    </article>
  );
}

function Timeline({ runs }: { runs: DashboardRun[] }) {
  if (!runs.length) {
    return (
      <div className="inline-empty">
        <Activity size={22} />
        <p>No Seed runs yet.</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {runs.map((run) => (
        <div key={run.id}>
          <i className={run.status === "completed" ? "done" : ""}>
            {run.status === "completed" ? <Check size={12} /> : <Activity size={12} />}
          </i>
          <span>
            <b>{run.request}</b>
            <small>
              {statusLabel(run.status as ProjectStatus)} · {formatTimestamp(run.createdAt)}
            </small>
          </span>
        </div>
      ))}
    </div>
  );
}

function Setup({
  icon: Icon,
  label,
  status,
}: {
  icon: LucideIcon;
  label: string;
  status: string;
}) {
  return (
    <div>
      <span>
        <Icon size={17} />
      </span>
      <p>
        <b>{label}</b>
        <small>{status}</small>
      </p>
    </div>
  );
}

function ProjectsView({ context }: { context: DashboardContext }) {
  return (
    <>
      <PageTitle
        eyebrow="Workspace"
        title="Projects"
        copy="Every website stays in the accounts you own."
        action={
          <Link className="primary-action" href="/onboarding">
            <Plus size={16} /> New project
          </Link>
        }
      />
      {context.projects.length ? (
        <section className="projects-grid">
          {context.projects.map((project) => (
            <ProjectCard project={project} key={project.id} />
          ))}
          <Link className="new-project-card" href="/onboarding">
            <Plus />
            <b>Create another project</b>
            <span>Business, lead or booking website</span>
          </Link>
        </section>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          copy="Create your first project to start connecting code, database and hosting."
          action={
            <Link className="primary-action" href="/onboarding">
              Create a project
            </Link>
          }
        />
      )}
    </>
  );
}

function ProjectCard({ project }: { project: DashboardProject }) {
  return (
    <Link className="project-card" href={`/dashboard?project=${project.id}`}>
      <div className="project-thumb">
        <span>{project.name}</span>
      </div>
      <div className="project-card-body">
        <div>
          <h3>{project.name}</h3>
          <span className={`status-pill ${statusClass(project.status)}`}>
            {statusLabel(project.status)}
          </span>
        </div>
        <p>
          {projectTypeLabel(project.projectType)} · Updated {formatTimestamp(project.updatedAt)}
        </p>
        <footer>
          <span>{project.websiteUrl ?? "Not deployed"}</span>
          <ArrowRight size={16} />
        </footer>
      </div>
    </Link>
  );
}

function OverviewView({
  context,
  navigate,
}: {
  context: DashboardContext;
  navigate: (view: View) => void;
}) {
  const connected = Object.values(context.connections).filter(
    (status) => status === "Connected",
  ).length;
  const latestRun = context.recentRuns[0];

  return (
    <>
      <PageTitle
        eyebrow={context.projectName}
        title="Project overview"
        copy="Live project state from your connected services."
        action={
          <button className="primary-action" onClick={() => navigate("ask")}>
            <Sparkles size={16} /> Make a change
          </button>
        }
      />
      <section className="overview-detail">
        <article className="panel project-state-card">
          <span className={`status-pill ${statusClass(context.projectStatus)}`}>
            {statusLabel(context.projectStatus)}
          </span>
          <h2>{context.projectName}</h2>
          <p>{projectTypeLabel(context.projectType)}</p>
          {context.websiteUrl ? (
            <a
              className="primary-action"
              href={context.websiteUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open live website <ExternalLink size={14} />
            </a>
          ) : (
            <button className="secondary-button" onClick={() => navigate("settings")}>
              Connect hosting
            </button>
          )}
        </article>
        <article className="panel readiness-card">
          <ShieldCheck size={30} />
          <h3>{connected === 4 ? "Ready to build" : "Setup required"}</h3>
          <p>
            {connected === 4
              ? "All required services are connected."
              : `${connected} of 4 required services are connected.`}
          </p>
          <button className="secondary-button" onClick={() => navigate("settings")}>
            Review connections
          </button>
        </article>
      </section>
      <section className="stats-grid compact">
        <Metric
          icon={CalendarDays}
          label="Bookings"
          value={String(context.counts.bookings)}
          detail="No imported booking data"
        />
        <Metric
          icon={Users}
          label="Customers"
          value={String(context.counts.customers)}
          detail="No imported customer data"
        />
        <Metric
          icon={Activity}
          label="Last Seed run"
          value={latestRun ? statusLabel(latestRun.status as ProjectStatus) : "None"}
          detail={latestRun ? formatTimestamp(latestRun.createdAt) : "No runs yet"}
          good={latestRun?.status === "completed"}
        />
        <Metric
          icon={Rocket}
          label="Deployment"
          value={context.websiteUrl ? "Available" : "None"}
          detail={context.websiteUrl ?? "Not deployed yet"}
          good={Boolean(context.websiteUrl)}
        />
      </section>
    </>
  );
}

function WebsiteView({
  context,
  navigate,
}: {
  context: DashboardContext;
  navigate: (view: View) => void;
}) {
  return (
    <>
      <PageTitle
        eyebrow={context.projectName}
        title="Website"
        copy="Publishing information from the connected Vercel project."
        action={
          context.websiteUrl ? (
            <a
              className="primary-action"
              href={context.websiteUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} /> Open live website
            </a>
          ) : undefined
        }
      />
      {context.websiteUrl ? (
        <article className="panel deployment-card">
          <span className="status-pill live">Live</span>
          <Globe2 size={34} />
          <h2>{context.projectName}</h2>
          <a href={context.websiteUrl} target="_blank" rel="noreferrer">
            {context.websiteUrl}
          </a>
          <p>The deployment URL was read from this project&apos;s connected resources.</p>
        </article>
      ) : (
        <EmptyState
          icon={Cloud}
          title="No website deployment yet"
          copy="Connect Vercel and approve a Seed build before a website appears here."
          action={
            <button className="primary-action" onClick={() => navigate("settings")}>
              Connect Vercel
            </button>
          }
        />
      )}
    </>
  );
}

function EmptyDataView({
  eyebrow,
  title,
  copy,
  icon,
  navigate,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  icon: LucideIcon;
  navigate: (view: View) => void;
}) {
  return (
    <>
      <PageTitle eyebrow={eyebrow} title={title} copy={copy} />
      <EmptyState
        icon={icon}
        title={`No ${title.toLowerCase()} yet`}
        copy="Seed will show real records here after the required project service is connected."
        action={
          <button className="primary-action" onClick={() => navigate("settings")}>
            Review connections
          </button>
        }
      />
    </>
  );
}

function AskView({
  request,
  setRequest,
  submit,
  planning,
  plan,
  enabled,
  navigate,
  pendingRunId,
  projectId,
  runStatus,
  setRunStatus,
}: {
  request: string;
  setRequest: (value: string) => void;
  submit: (event: FormEvent) => void;
  planning: boolean;
  plan: PlanStep[] | null;
  enabled: boolean;
  navigate: (view: View) => void;
  pendingRunId: string | null;
  projectId: string;
  workspaceId: string;
  runStatus: RunStatus | null;
  setRunStatus: (status: RunStatus | null) => void;
}) {
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning =
    runStatus?.run.status === "running";
  const isWaitingForUser =
    runStatus?.run.status === "waiting_for_user";
  const isFailed = runStatus?.run.status === "failed";
  const previewReady = isWaitingForUser && Boolean(runStatus?.previewUrl);

  const pollStatus = useCallback(async () => {
    if (!pendingRunId || !projectId) return;
    try {
      const res = await fetch(
        `/api/seed/run-status?runId=${encodeURIComponent(pendingRunId)}&projectId=${encodeURIComponent(projectId)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as RunStatus;
      setRunStatus(data);
      // Stop polling once finished
      if (
        data.run.status === "waiting_for_user" ||
        data.run.status === "completed" ||
        data.run.status === "failed" ||
        data.run.status === "rolled_back"
      ) {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      // Silently retry on network error
    }
  }, [pendingRunId, projectId, setRunStatus]);

  // Start/stop polling when runId changes or execution begins
  useEffect(() => {
    if (!pendingRunId || !isRunning) return;
    pollRef.current = setInterval(() => { void pollStatus(); }, 3_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pendingRunId, isRunning, pollStatus]);

  async function approve() {
    if (!pendingRunId || !projectId || approving) return;
    setApproving(true);
    setApproveError(null);
    try {
      const res = await fetch("/api/seed/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: pendingRunId, projectId }),
      });
      const data = (await res.json()) as { message?: string; status?: string };
      if (!res.ok) {
        setApproveError(data.message ?? "Could not start the run.");
        setApproving(false);
        return;
      }
      // Trigger first poll immediately, then interval will take over
      void pollStatus();
      // Start polling
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => { void pollStatus(); }, 3_000);
    } catch {
      setApproveError("Could not reach Seed. Please try again.");
      setApproving(false);
    }
  }

  async function publish() {
    if (!pendingRunId || !projectId || publishing) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/seed/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: pendingRunId, projectId }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setApproveError(data.message ?? "Could not publish.");
      } else {
        // Resume polling for completed status
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => { void pollStatus(); }, 3_000);
      }
    } catch {
      setApproveError("Could not reach Seed. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  function stepIcon(status: string) {
    if (status === "completed") return <Check size={13} />;
    if (status === "running") return <LoaderCircle className="spin" size={13} />;
    if (status === "failed") return <X size={13} />;
    return null;
  }

  function stepClass(status: string) {
    if (status === "completed") return "step-done";
    if (status === "running") return "step-running";
    if (status === "failed") return "step-failed";
    return "step-pending";
  }

  function stepLabel(stepType: string) {
    const labels: Record<string, string> = {
      inspect: "Inspect current project state",
      generate_files: "Generate application files",
      guard: "Seed Guard validation",
      github_repo: "Create GitHub repository",
      github_push: "Push application code",
      supabase_project: "Create Supabase project",
      supabase_migrate: "Apply database schema",
      vercel_project: "Create Vercel project",
      vercel_env: "Configure environment variables",
      vercel_deploy: "Deploy preview",
      verify_preview: "Verify preview website",
      record_snapshot: "Record project snapshot",
    };
    return labels[stepType] ?? stepType.replace(/_/g, " ");
  }

  return (
    <>
      <PageTitle
        eyebrow="Seed AI"
        title="Ask Seed"
        copy="Describe what you need. Seed checks everything before changing your project."
      />
      {!enabled && (
        <div className="connection-required" role="status">
          <Bot size={18} />
          <span>
            <b>Connect your OpenAI API key to activate Seed AI.</b>
            <small>Your key is encrypted and billed directly to your OpenAI account.</small>
          </span>
          <button className="secondary-button" onClick={() => navigate("settings")}>
            Connect OpenAI
          </button>
        </div>
      )}
      <section className="ask-layout">
        <article className="chat-panel panel">
          <div className="chat-empty">
            <div className="seed-mark">
              <Sparkles />
            </div>
            <h2>What should we work on?</h2>
            <p>Use plain language in Hindi or English.</p>
            <div>
              <button onClick={() => setRequest("Build the first version of my website")}>
                Build my website
              </button>
              <button onClick={() => setRequest("Add a contact form")}>
                Add a contact form
              </button>
              <button onClick={() => setRequest("Add booking requests")}>
                Add bookings
              </button>
            </div>
          </div>
          <form className="chat-input" onSubmit={submit}>
            <textarea
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              placeholder="Ask Seed anything about this project…"
              rows={3}
              disabled={!enabled}
            />
            <footer>
              <span>
                <ShieldCheck size={14} /> Guarded by Seed
              </span>
              <button
                aria-label="Create build plan"
                disabled={!enabled || planning || !request.trim()}
              >
                {planning ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}
              </button>
            </footer>
          </form>
        </article>
        <aside className="panel run-panel">
          <h3>Build plan</h3>
          {!plan && !planning && !runStatus && (
            <div className="empty-plan">
              <BookOpen />
              <p>Your project-specific plan will appear here before Seed makes changes.</p>
            </div>
          )}
          {planning && (
            <div className="planning">
              <LoaderCircle className="spin" />
              <b>Reading your request…</b>
              <span>Seed is choosing skills and checking policies.</span>
            </div>
          )}

          {/* ── Execution progress ─────────────────────────────────── */}
          {runStatus && (
            <>
              <div className="run-progress">
                {runStatus.steps.map((step) => (
                  <div key={step.stepType} className={`run-step ${stepClass(step.status)}`}>
                    <i>{stepIcon(step.status)}</i>
                    <span>
                      <b>{stepLabel(step.stepType)}</b>
                      {step.errorMessage && (
                        <small className="step-error">{step.errorMessage}</small>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Preview ready — show open + publish */}
              {previewReady && runStatus.previewUrl && (
                <div className="preview-actions">
                  <p className="preview-ready-label">
                    <Check size={15} /> Preview is ready
                  </p>
                  <a
                    className="primary-action full"
                    href={runStatus.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe2 size={16} /> Open Preview
                  </a>
                  <button
                    className="secondary-button full"
                    onClick={() => { void publish(); }}
                    disabled={publishing}
                  >
                    {publishing ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : (
                      <Rocket size={16} />
                    )}
                    {publishing ? "Publishing…" : "Publish Website"}
                  </button>
                  <small className="approval-note">
                    <ShieldCheck size={13} /> Production publishing requires your explicit
                    approval.
                  </small>
                </div>
              )}

              {/* Production live */}
              {runStatus.run.status === "completed" && runStatus.productionUrl && (
                <div className="preview-actions">
                  <p className="preview-ready-label">
                    <Check size={15} /> Website is live
                  </p>
                  <a
                    className="primary-action full"
                    href={runStatus.productionUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe2 size={16} /> Open Live Website
                  </a>
                </div>
              )}

              {/* Failed state */}
              {isFailed && (
                <p className="step-error" style={{ marginTop: "1rem" }}>
                  Seed encountered an error. Check the step above for details.
                </p>
              )}
            </>
          )}

          {/* ── Plan + Approve button ──────────────────────────────── */}
          {plan && !runStatus && (
            <>
              <p className="plan-intro">
                Seed will use the latest connected project state before changing anything.
              </p>
              <div className="run-steps">
                {plan.map((step, index) => (
                  <div key={`${step.title}-${index}`}>
                    <i>{index + 1}</i>
                    <span>
                      <b>{step.title}</b>
                      <small>{step.kind}</small>
                    </span>
                  </div>
                ))}
              </div>
              {approveError && <p className="step-error">{approveError}</p>}
              {pendingRunId ? (
                <button
                  className="primary-action full"
                  onClick={() => { void approve(); }}
                  disabled={approving}
                >
                  {approving ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <Rocket size={16} />
                  )}
                  {approving ? "Starting…" : "Approve & Create Preview"}
                </button>
              ) : (
                <button className="primary-action full" disabled>
                  <Rocket size={16} /> Preview requires provider connections
                </button>
              )}
              <small className="approval-note">
                <ShieldCheck size={13} /> Production publishing remains blocked until every
                required check passes.
              </small>
            </>
          )}
        </aside>
      </section>
    </>
  );
}


function SettingsView({
  connections,
  open,
  disconnect,
}: {
  connections: Connection[];
  open: (connection: Connection) => void;
  disconnect: (connection: Connection) => void;
}) {
  return (
    <>
      <PageTitle
        eyebrow="Workspace settings"
        title="Connections"
        copy="Seed works in services you own. You can disconnect them anytime."
      />
      <article className="panel connection-page">
        <div className="connection-intro">
          <LockKeyhole />
          <div>
            <h3>Your accounts stay yours</h3>
            <p>
              Seed receives only the access needed to manage this project. Passwords are
              never requested or stored.
            </p>
          </div>
        </div>
        {connections.map((connection) => (
          <div className="connection-row" key={connection.id}>
            <span className="provider-logo">
              <connection.icon />
            </span>
            <div>
              <b>{connection.label}</b>
              <small>{connection.detail}</small>
            </div>
            <span
              className={`status-pill ${
                connection.status === "Connected"
                  ? "live"
                  : connection.status === "Connecting"
                    ? "warning"
                    : "idle"
              }`}
            >
              {connection.status}
            </span>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              {connection.status === "Not connected" ? (
                <button className="secondary-button" onClick={() => open(connection)}>
                  Connect
                </button>
              ) : (
                <>
                  <button className="secondary-button" onClick={() => open(connection)}>
                    Reconnect
                  </button>
                  <button
                    className="secondary-button"
                    style={{ color: "#a54036", borderColor: "#fce8e5" }}
                    onClick={() => disconnect(connection)}
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </article>
    </>
  );
}

function ConnectionModal({
  connection,
  apiKey,
  setApiKey,
  close,
  connect,
}: {
  connection: Connection;
  apiKey: string;
  setApiKey: (value: string) => void;
  close: () => void;
  connect: (connection: Connection, event?: FormEvent) => void;
}) {
  const isOpenAi = connection.id === "openai";
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <form
        className="modal"
        onSubmit={(event) => connect(connection, event)}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={close} aria-label="Close">
          <X />
        </button>
        <span className="provider-logo large">
          <connection.icon />
        </span>
        <p className="eyebrow">{connection.label}</p>
        <h2>{isOpenAi ? "Activate Seed AI" : `Connect ${connection.label.toLowerCase()}`}</h2>
        <p>
          {isOpenAi
            ? "Use your own OpenAI API key. Seed validates it, encrypts it server-side and never returns it to the browser. OpenAI bills your account directly."
            : "You’ll be sent to the provider to approve access. Seed never asks for your password."}
        </p>
        {isOpenAi && (
          <label className="field-label">
            OpenAI API key
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-…"
              autoComplete="off"
              required
            />
          </label>
        )}
        <button className="primary-action full" type="submit">
          {isOpenAi ? "Validate and save securely" : "Continue to authorize"}
          <ArrowRight size={16} />
        </button>
        <small className="modal-safe">
          <ShieldCheck size={13} /> Minimum access · Disconnect anytime · Audited actions
        </small>
      </form>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  copy,
  action,
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <article className="panel empty-state">
      <span>
        <Icon />
      </span>
      <h2>{title}</h2>
      <p>{copy}</p>
      {action}
    </article>
  );
}
