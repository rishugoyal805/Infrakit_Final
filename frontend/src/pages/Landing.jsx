import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";

const MAIN_CHAIN = [
  { label: "Rate Limiter", icon: "Gauge" },
  { label: "Shield", icon: "ShieldCheck" },
  { label: "Logger", icon: "FileText" },
];

const BRANCH = [
  { label: "Cache", icon: "Database" },
  { label: "Queue", icon: "ListOrdered" },
];

function NodeChip({ label, icon }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-800 shadow-sm whitespace-nowrap">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-orange-50 text-orange-600">
        <Icon name={icon} size={13} strokeWidth={2} />
      </span>
      {label}
    </div>
  );
}

function FlowArrow() {
  return (
    <span className="h-px w-5 shrink-0 bg-slate-300 relative after:absolute after:-right-0.5 after:-top-[3px] after:border-y-[3px] after:border-y-transparent after:border-l-[4px] after:border-l-slate-300" />
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-[2px] bg-orange-600" />
            <span className="h-2 w-2 rounded-[2px] bg-orange-400" />
            <span className="h-2 w-2 rounded-[2px] bg-orange-300" />
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-950">
            InfraKit
            <span className="ml-1.5 font-medium text-slate-400">Visual Editor</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 text-sm sm:gap-6">
          <Link to="/login" className="font-medium text-slate-600 transition hover:text-slate-950">
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-20 lg:pb-28 lg:pt-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Infrastructure, made visual
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.6rem]">
              Design your infrastructure flow. Export code that runs.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
              Drag your InfraKit packages onto a canvas, wire them in request order,
              configure their properties, and export a ready-to-use
              <code className="mx-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-700">
                infrakit.config.js
              </code>
              and
              <code className="ml-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-700">
                setup-infrakit.js
              </code>
              .
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/signup"
                className="rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700"
              >
                Start building free
              </Link>
              <Link
                to="/login"
                className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
              >
                Log in <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-400">
              <span>✓ No card required</span>
              <span>✓ Real package configuration</span>
              <span>✓ Exportable setup</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-full bg-orange-100/50 blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/30 sm:p-5">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-4">
                <span className="h-2 w-2 rounded-full bg-slate-200" />
                <span className="h-2 w-2 rounded-full bg-slate-200" />
                <span className="h-2 w-2 rounded-full bg-slate-200" />
                <span className="ml-auto rounded-md bg-slate-50 px-2 py-1 font-mono text-[9px] text-slate-400">
                  infra-canvas
                </span>
              </div>

              <div className="relative mt-8 min-h-[180px]">
                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                  {MAIN_CHAIN.map((node, index) => (
                    <div key={node.label} className="flex shrink-0 items-center gap-2">
                      <NodeChip {...node} />
                      {index < MAIN_CHAIN.length - 1 && <FlowArrow />}
                    </div>
                  ))}
                </div>

                <div className="mx-auto mt-9 h-8 w-px bg-slate-300" />

                <div className="flex items-center justify-center gap-2">
                  {BRANCH.map((node, index) => (
                    <div key={node.label} className="flex items-center gap-2">
                      <NodeChip {...node} />
                      {index < BRANCH.length - 1 && <FlowArrow />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Ready to export
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-20 sm:grid-cols-3 sm:px-8 lg:pb-24">
          {[
            ["01", "Drop a package", <>Every node comes from your InfraKit build — no fake components or mock data.</>],
            ["02", "Wire the order", <>Connect nodes to represent the actual <code className="rounded bg-slate-100 px-1 font-mono text-xs">require()</code> / <code className="rounded bg-slate-100 px-1 font-mono text-xs">app.use()</code> flow.</>],
            ["03", "Export & run", <>Get your config, setup script, README, and optional dashboard credentials in one export.</>],
          ].map(([number, title, text]) => (
            <article key={number} className="rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50">
              <span className="font-mono text-xs font-bold text-orange-600">{number}</span>
              <h2 className="mt-4 text-base font-bold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:pb-24">
          <div className="rounded-2xl border border-slate-200 bg-slate-900 px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-orange-300">
                Honest by design
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                What is real is clear. What is coming is marked.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Switch between AWS, GCP, and Azure skins to view your architecture
                in familiar terms. Anything without a real package behind it is
                marked <strong className="text-slate-200">Soon</strong> instead of
                pretending to be production-ready.
              </p>
            </div>
            <Link
              to="/signup"
              className="mt-7 inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-50 lg:mt-0"
            >
              Start wiring your stack
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-5 pb-10 text-center text-xs text-slate-400 sm:px-8">
        InfraKit Visual Editor. Not affiliated with Amazon Web Services, Google Cloud, or Microsoft Azure.
      </footer>
    </div>
  );
}
