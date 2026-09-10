const fallbackAppUrl = "http://localhost:3000";

export const reservedUsernames = new Set([
  "account",
  "admin",
  "api",
  "app",
  "auth",
  "dashboard",
  "help",
  "localhost",
  "login",
  "status",
  "support",
  "www",
]);

export const usernamePattern = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export function isAvailableUsernameFormat(value: string) {
  return usernamePattern.test(value) && !reservedUsernames.has(value);
}

export function rootDomain() {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim().toLowerCase() ?? "";
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? fallbackAppUrl).replace(/\/$/, "");
}

export function rootUrl(path = "/") {
  const base = rootDomain() ? `https://${rootDomain()}` : appUrl();
  return new URL(path, `${base}/`).toString();
}

export function dashboardUrl(username: string, path = "/dashboard") {
  const base = rootDomain()
    ? `https://${username}.${rootDomain()}`
    : appUrl();
  return new URL(path, `${base}/`).toString();
}

function hostnameFromHost(host: string | null) {
  return host?.toLowerCase().split(":")[0].replace(/\.$/, "") ?? "";
}

export function isRootHost(host: string | null) {
  const domain = rootDomain();
  const hostname = hostnameFromHost(host);
  return Boolean(
    domain && (hostname === domain || hostname === `www.${domain}`),
  );
}

export function usernameFromHost(host: string | null) {
  const domain = rootDomain();
  const hostname = hostnameFromHost(host);
  if (!domain || !hostname || isRootHost(host)) return null;
  if (!hostname.endsWith(`.${domain}`)) return null;

  const candidate = hostname.slice(0, -(domain.length + 1));
  return candidate.includes(".") ? null : candidate;
}

export function sharedAuthCookieOptions<T extends Record<string, unknown>>(
  options: T,
) {
  const domain = rootDomain();
  if (!domain || domain === "localhost" || domain.endsWith(".localhost")) {
    return options;
  }
  return { ...options, domain: `.${domain}` };
}
