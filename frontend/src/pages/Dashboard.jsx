import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Dashboard({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    api.listProjects()
      .then((r) => setProjects(r.projects))
      .catch((err) => setError(err.message))
      .finally(() => setLoaded(true));
  }, []);

  async function createProject(e) {
    e.preventDefault();
    if (!newName.trim() || creating) return;

    setError("");
    setCreating(true);

    try {
      const { id } = await api.createProject(newName.trim());
      nav(`/projects/${id}`);
    } catch (err) {
      setError(`Couldn't create project: ${err.message}`);
    } finally {
      setCreating(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this project?")) return;

    try {
      await api.deleteProject(id);
      setProjects((p) => p.filter((proj) => proj.id !== id));
    } catch (err) {
      setError(`Couldn't delete project: ${err.message}`);
    }
  }

  async function logout() {
    await api.logout();
    onLogout();
  }

  const projectCount = projects.length;
  const latestProject = useMemo(
    () => projects.reduce((latest, p) => latest || p, null),
    [projects]
  );

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-[#151515]">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-3 text-sm font-bold tracking-tight no-underline">
            <span className="grid grid-cols-2 gap-[3px]" aria-hidden="true">
              <span className="h-[7px] w-[7px] bg-[#151515]" />
              <span className="h-[7px] w-[7px] bg-orange-500" />
              <span className="h-[7px] w-[7px] bg-slate-300" />
            </span>
            InfraKit
            <span className="hidden font-mono text-[9px] font-medium uppercase tracking-[.14em] text-slate-400 sm:inline">
              / workspace
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-[220px] truncate font-mono text-[10px] text-slate-400 sm:block">
              {user.email}
            </span>
            <button
              onClick={logout}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-[#151515]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="font-mono text-[9px] font-bold uppercase tracking-[.2em] text-orange-600">
              Workspace
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="text-4xl font-bold tracking-[-.05em] sm:text-5xl">Projects</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Architect your request paths, keep configurations together, and open any stack directly in the canvas.
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
                <div className="font-mono text-xl font-bold">{projectCount.toString().padStart(2, "0")}</div>
                <div className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-slate-400">projects</div>
              </div>
            </div>
          </div>

          <div className="hidden rounded-lg bg-[#151515] p-5 text-white lg:block">
            <div className="font-mono text-[9px] uppercase tracking-[.18em] text-orange-400">Workspace status</div>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Ready to build
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              {latestProject ? `Latest project: ${latestProject.name}` : "Create your first project to open the visual editor."}
            </p>
          </div>
        </section>

        <section className="mt-10 max-w-4xl">
          <form onSubmit={createProject} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-orange-500">+</span>
              <input
                placeholder="Name your next infrastructure project…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white py-3.5 pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="rounded-md bg-[#151515] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creating ? "Creating…" : "New project →"}
            </button>
          </form>

          {error && (
            <p role="alert" className="mt-4 border-l-2 border-red-500 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              {error}
            </p>
          )}
        </section>

        {!loaded && (
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-lg border border-slate-200 bg-white" />
            ))}
          </div>
        )}

        {loaded && projects.length === 0 && (
          <div className="mt-12 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="relative flex min-h-[300px] items-center justify-center px-6 py-12">
              <div className="absolute inset-0 opacity-50" style={{
                backgroundImage: "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
                backgroundSize: "32px 32px"
              }} />
              <div className="relative max-w-md text-center">
                <div className="mx-auto mb-6 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-md border-2 border-slate-300 bg-white" />
                  <div className="h-px w-8 bg-slate-300" />
                  <div className="h-10 w-10 rounded-md border-2 border-orange-300 bg-orange-50" />
                  <div className="h-px w-8 bg-slate-300" />
                  <div className="h-10 w-10 rounded-md border-2 border-slate-300 bg-white" />
                </div>
                <h2 className="text-lg font-bold tracking-tight">Your canvas is empty.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Give your next stack a name above. InfraKit will open a fresh visual workspace for it.
                </p>
              </div>
            </div>
          </div>
        )}

        {loaded && projects.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">
                Your architectures
              </h2>
              <span className="font-mono text-[9px] text-slate-400">click a project to open</span>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, index) => (
                <li key={p.id} className="group relative list-none overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60">
                  <Link to={`/projects/${p.id}`} className="block p-5 pr-16 no-underline">
                    <div className="mb-9 flex items-center justify-between">
                      <span className="font-mono text-[9px] font-bold text-orange-600">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="block truncate text-base font-bold tracking-[-.02em] text-[#151515]">
                      {p.name}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[9px] uppercase tracking-wider text-slate-400">
                      Updated {p.updated_at}
                    </span>
                  </Link>

                  <button
                    onClick={() => remove(p.id)}
                    className="absolute right-4 top-4 rounded-md p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
                    title="Delete project"
                    aria-label={`Delete ${p.name}`}
                  >
                    ×
                  </button>

                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-orange-500 transition-all duration-300 group-hover:w-full" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
