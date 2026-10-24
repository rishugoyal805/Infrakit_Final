import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Login({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await api.login(email.trim(), password);
      onAuth(user);
      nav("/");
    } catch (err) {
      setError(err.message || "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f1eb] px-5 py-12 text-slate-950">
      <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/3 -translate-y-1/3 rounded-full bg-orange-200/35 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-amber-100/40 blur-3xl" />

      <Link to="/" className="absolute left-5 top-5 flex items-center gap-2.5 text-sm font-bold tracking-tight sm:left-8 sm:top-7">
        <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-[2px] bg-orange-600" />
          <span className="h-2 w-2 rounded-[2px] bg-orange-400" />
          <span className="h-2 w-2 rounded-[2px] bg-orange-300" />
        </span>
        InfraKit
      </Link>

      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,.10)] sm:p-9"
      >
        <div className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Log in to continue building your infrastructure.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/15 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          No account?{" "}
          <Link to="/signup" className="font-semibold text-orange-600 hover:text-orange-700">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}



// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { api } from "../api.js";

// export default function Login({ onAuth }) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const nav = useNavigate();

//   async function submit(e) {
//     e.preventDefault();
//     setError("");
//     try {
//       const { user } = await api.login(email, password);
//       onAuth(user);
//       nav("/");
//     } catch (err) {
//       setError(err.message);
//     }
//   }

//   return (
//     <div className="auth-screen">
//       <form onSubmit={submit} className="auth-form">
//         <h1>InfraKit Visual Editor</h1>
//         <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
//         <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
//         {error && <p className="error">{error}</p>}
//         <button type="submit">Log in</button>
//         <p>No account? <Link to="/signup">Sign up</Link></p>
//       </form>
//     </div>
//   );
// }
