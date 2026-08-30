import { afterEach, describe, expect, it } from "vitest";
import {
  dashboardUrl,
  isAvailableUsernameFormat,
  normalizeUsername,
  rootUrl,
  usernameFromHost,
} from "@/lib/tenancy";

const previousRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_ROOT_DOMAIN = previousRootDomain;
  process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
});

describe("Seed tenant usernames", () => {
  it("normalizes friendly input and rejects reserved or malformed names", () => {
    expect(normalizeUsername("  My Studio! ")).toBe("my-studio");
    expect(isAvailableUsernameFormat("my-studio")).toBe(true);
    expect(isAvailableUsernameFormat("admin")).toBe(false);
    expect(isAvailableUsernameFormat("ab")).toBe(false);
    expect(isAvailableUsernameFormat("-studio")).toBe(false);
  });

  it("extracts only a direct tenant subdomain", () => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "bestmodel.fun";
    expect(usernameFromHost("shikha.bestmodel.fun")).toBe("shikha");
    expect(usernameFromHost("shikha.bestmodel.fun:443")).toBe("shikha");
    expect(usernameFromHost("bestmodel.fun")).toBeNull();
    expect(usernameFromHost("a.b.bestmodel.fun")).toBeNull();
  });

  it("builds central and tenant URLs", () => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "bestmodel.fun";
    expect(rootUrl("/login")).toBe("https://bestmodel.fun/login");
    expect(dashboardUrl("shikha")).toBe(
      "https://shikha.bestmodel.fun/dashboard",
    );
  });
});
