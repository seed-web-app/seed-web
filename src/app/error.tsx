"use client";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className="error-page"><div className="seed-mark">!</div><h1>Seed hit a small snag.</h1><p>Your live website was not changed. Try this step again.</p><button className="button button-dark" onClick={reset}>Try again</button></main>}
