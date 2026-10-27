import { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api.js";

export default function DashboardAccessModal({ projectId, onClose }) {
  const [stage, setStage] = useState("reauth");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState(null);
  const [justReset, setJustReset] = useState(null);

  const inputClass =
    "rounded-md border border-border bg-[#fafafa] px-2.5 py-2 font-mono text-[12px]";
  const copyBtnClass =
    "rounded-md border border-border px-3 text-[12px] text-ink hover:cursor-pointer hover:bg-[#f5f5f7]";
  const codeClass = "rounded bg-[#f2f2f4] px-1 py-px font-mono text-[11.5px]";

  async function loadCredentials() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getDashboardCredentials(projectId);
      setCreds(data);
      setStage("view");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitReauth(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.reauth(password);
      await loadCredentials();
    } catch (err) {
      setError(
        err.message === "wrong_password" ? "Wrong password." : err.message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (
      creds?.hasPassword &&
      !confirm("This immediately invalidates the current password. Continue?")
    )
      return;
    setLoading(true);
    setError("");
    try {
      const result = await api.resetDashboardPassword(projectId);
      setJustReset(result);
      setCreds({
        accessKey: result.accessKey,
        hasPassword: true,
        passwordCreatedAt: "just now",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-access-title"
        className="my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-2xl border border-black/5 bg-white p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3
            id="dashboard-access-title"
            className="m-0 text-[15px] font-semibold tracking-tight text-ink"
          >
            Dashboard Access
          </h3>
          <button
            onClick={onClose}
            className="text-xl leading-none text-ink-soft hover:text-ink hover:cursor-pointer"
          >
            ×
          </button>
        </div>

        {stage === "reauth" && (
          <form className="flex flex-col gap-4">
            <p className="text-[12.5px] text-ink-soft">
              Confirm your account password to view or reset dashboard
              credentials.
            </p>
            <input
              type="password"
              placeholder="Your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="rounded-[7px] border border-border px-2.5 py-2.5 text-[13px] focus:border-ink focus:outline-none"
            />
            {error && <p className="text-[13px] text-red-700">{error}</p>}
            <button
              type="submit"
              onClick={submitReauth}
              disabled={loading || !password.trim()}
              className="flex min-h-10 w-full border border-border items-center justify-center rounded-lg bg-ink px-4 py-2.5 text-[13px] font-semibold text-black transition-colors hover:bg-[#333338] hover:text-white hover:cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Checking…" : "Confirm"}
            </button>
          </form>
        )}

        {stage === "view" && creds && (
          <div className="flex flex-col gap-1">
            <label className="flex flex-col gap-1.5 text-[12.5px]">
              <span className="font-semibold text-ink">Project Key</span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={creds.accessKey || "—"}
                  className={`flex-1 ${inputClass}`}
                />
                <button
                  onClick={() => navigator.clipboard.writeText(creds.accessKey)}
                  className={copyBtnClass}
                >
                  Copy
                </button>
              </div>
            </label>
            <p className="text-[12.5px] text-ink-soft">
              Stable — the same key across every export. Enter it, along with a
              password, at <code className={codeClass}>/infrakit-access</code>{" "}
              on your deployed app.
            </p>

            <div className="my-2.5 h-px bg-border" />

            {justReset ? (
              <>
                <label className="flex flex-col gap-1.5 text-[12.5px]">
                  <span className="font-semibold text-ink">
                    New Password — shown once, copy it now
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={justReset.password}
                      className={`flex-1 ${inputClass}`}
                    />
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(justReset.password)
                      }
                      className={copyBtnClass}
                    >
                      Copy
                    </button>
                  </div>
                </label>
                <p className="text-[12.5px] text-ink-soft">
                  This won't be shown again. Put it in your deployed app's{" "}
                  <code className={codeClass}>.env</code> as{" "}
                  <code className={codeClass}>DASHBOARD_ACCESS_PASSWORD</code>.
                </p>
              </>
            ) : (
              <p className="text-[12.5px] text-ink-soft">
                Password:{" "}
                {creds.hasPassword
                  ? `set (${creds.passwordCreatedAt})`
                  : "never set"}
                . It's hashed — even we can't show you the current one, only
                generate a new one.
              </p>
            )}

            {error && <p className="text-[13px] text-red-700">{error}</p>}
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="mt-3 flex min-h-10 w-full border border-border shrink-0 items-center justify-center rounded-lg bg-ink px-4 py-2.5 text-[13px] hover:cursor-pointer font-semibold text-black transition-colors hover:opacity-90 hover:bg-[#333338] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Working…"
                : creds.hasPassword
                  ? "Reset Password"
                  : "Generate Password"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// import { useState } from "react";
// import { api } from "../api.js";

// export default function DashboardAccessModal({ projectId, onClose }) {
//   const [stage, setStage] = useState("reauth"); // reauth | view
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const [creds, setCreds] = useState(null); // { accessKey, hasPassword, passwordCreatedAt }
//   const [justReset, setJustReset] = useState(null); // { accessKey, password } — shown once, then discarded

//   async function loadCredentials() {
//     setLoading(true);
//     setError("");
//     try {
//       const data = await api.getDashboardCredentials(projectId);
//       setCreds(data);
//       setStage("view");
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function submitReauth(e) {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     try {
//       await api.reauth(password);
//       await loadCredentials();
//     } catch (err) {
//       setError(err.message === "wrong_password" ? "Wrong password." : err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleReset() {
//     if (creds?.hasPassword && !confirm("This immediately invalidates the current password. Continue?")) return;
//     setLoading(true);
//     setError("");
//     try {
//       const result = await api.resetDashboardPassword(projectId);
//       setJustReset(result);
//       setCreds({ accessKey: result.accessKey, hasPassword: true, passwordCreatedAt: "just now" });
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="modal-backdrop" onClick={onClose}>
//       <div className="modal-card" onClick={(e) => e.stopPropagation()}>
//         <div className="modal-header">
//           <h3>Dashboard Access</h3>
//           <button onClick={onClose}>×</button>
//         </div>

//         {stage === "reauth" && (
//           <form onSubmit={submitReauth} className="reauth-form">
//             <p className="muted">Confirm your account password to view or reset dashboard credentials.</p>
//             <input
//               type="password"
//               placeholder="Your account password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               autoFocus
//               required
//             />
//             {error && <p className="error">{error}</p>}
//             <button type="submit" disabled={loading}>{loading ? "Checking…" : "Confirm"}</button>
//           </form>
//         )}

//         {stage === "view" && creds && (
//           <div className="creds-view">
//             <label className="property-field">
//               <span>Project Key</span>
//               <div className="copy-row">
//                 <input type="text" readOnly value={creds.accessKey || "—"} />
//                 <button onClick={() => navigator.clipboard.writeText(creds.accessKey)}>Copy</button>
//               </div>
//             </label>
//             <p className="muted">
//               Stable — the same key across every export. Enter it, along with a password, at{" "}
//               <code>/infrakit-access</code> on your deployed app.
//             </p>

//             <div className="creds-divider" />

//             {justReset ? (
//               <>
//                 <label className="property-field">
//                   <span>New Password — shown once, copy it now</span>
//                   <div className="copy-row">
//                     <input type="text" readOnly value={justReset.password} />
//                     <button onClick={() => navigator.clipboard.writeText(justReset.password)}>Copy</button>
//                   </div>
//                 </label>
//                 <p className="muted">
//                   This won't be shown again. Put it in your deployed app's <code>.env</code> as{" "}
//                   <code>DASHBOARD_ACCESS_PASSWORD</code>.
//                 </p>
//               </>
//             ) : (
//               <p className="muted">
//                 Password: {creds.hasPassword ? `set (${creds.passwordCreatedAt})` : "never set"}. It's hashed —
//                 even we can't show you the current one, only generate a new one.
//               </p>
//             )}

//             {error && <p className="error">{error}</p>}
//             <button onClick={handleReset} disabled={loading} className="primary">
//               {loading ? "Working…" : creds.hasPassword ? "Reset Password" : "Generate Password"}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
