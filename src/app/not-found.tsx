import Link from "next/link";
export default function NotFound(){return <main className="error-page"><div className="seed-mark">?</div><h1>That page has not grown yet.</h1><p>Return to your Seed workspace.</p><Link className="button button-dark" href="/dashboard">Open dashboard</Link></main>}
