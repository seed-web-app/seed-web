# Security policy

Please report suspected vulnerabilities privately to the Seed maintainers rather than opening a public issue. Do not include real provider tokens, API keys, customer data, or database exports in a report.

Seed's security boundaries are documented in `policies/`. Provider credentials must remain encrypted at rest and server-only, every provider action must verify workspace ownership, and every generated change must pass Seed Guard before preview or production deployment.
