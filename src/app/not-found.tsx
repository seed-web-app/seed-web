import Link from "next/link";

export default function NotFound() {
  return (
    <main className="message-page">
      <p className="section-label">404</p>
      <h1>Nothing lives here yet.</h1>
      <Link className="primary-action" href="/">
        Return home
      </Link>
    </main>
  );
}
