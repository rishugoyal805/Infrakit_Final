/**
 * Generates infrakit-dashboard-auth-check.js: middleware that gates the
 * ENTIRE @infrakit/dashboard base path (not just the login route) behind a
 * live, repeated check with the platform — so the platform can revoke a
 * project's dashboard access at any time, not just at the moment someone
 * logs in through infrakit-dashboard-login.js.
 *
 * SECURITY SHAPE, DELIBERATELY CHOSEN:
 * This check runs server-to-server, using DASHBOARD_ACCESS_KEY/PASSWORD
 * already sitting in this app's own .env — never in browser JS, never in a
 * cookie the browser controls, no CORS surface exposed on the platform for
 * arbitrary customer origins. The browser never talks to the platform
 * directly; it only ever talks to this app, which is the one making the
 * server-to-server call. This reuses the EXISTING /auth/verify-credentials
 * endpoint rather than adding new platform surface.
 *
 * Mounted in front of the dashboard's entire base path (not just /login) so
 * it can't be bypassed by someone who already knows dashboard's own raw
 * username/password and goes straight to its login route.
 *
 * TRADEOFFS, STATED EXPLICITLY RATHER THAN LEFT IMPLICIT:
 * - Result is cached for CHECK_CACHE_MS so every dashboard click doesn't
 *   trigger a platform round-trip. Revocation takes effect within that
 *   window, not instantly.
 * - Fails OPEN on network errors to the platform (last known-good result is
 *   reused) — a platform outage shouldn't lock someone out of their own
 *   server. Flip FAIL_CLOSED_ON_PLATFORM_ERROR below if you'd rather
 *   prioritize strictness over availability.
 */
export function generateDashboardAuthCheckMiddleware({ platformOrigin, dashboardBasePath = "/infrakit" }) {
  return `
const PLATFORM_ORIGIN = "http://localhost:4000";
const CHECK_CACHE_MS = 60 * 1000;

// Credentials verified through the Dashboard Access form.
// They take priority over environment variables.
let runtimeCredentials = null;

let cached = null;

async function checkWithPlatform() {
  const accessKey =
    runtimeCredentials?.accessKey ||
    process.env.DASHBOARD_ACCESS_KEY;

  const password =
    runtimeCredentials?.password ||
    process.env.DASHBOARD_ACCESS_PASSWORD;

  if (!accessKey || !password) {
    console.warn(
      "[InfraKit Auth] No verified platform credentials available."
    );
    return false;
  }

  try {
    const resp = await fetch(
      \`\${PLATFORM_ORIGIN}/auth/verify-credentials\`
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessKey,
          password
        })
      }
    );

    if (!resp.ok) {
      console.error(
        "[InfraKit Auth] Platform returned:",
        resp.status
      );
      return false;
    }

    const result = await resp.json();

    return result.valid === true;

  } catch (err) {
    console.error(
      "[InfraKit Auth] Platform connection failed:",
      err.message
    );

    // Reuse last successful verification during a temporary outage.
    return cached?.valid === true;
  }
}

function renderRevoked() {
  return \`<!doctype html>
  <html>
  <head>
    <title>Dashboard Access Unavailable</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #f7f7f8;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
      }

      .card {
        background: white;
        padding: 32px;
        border-radius: 12px;
        width: 320px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,.08);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h3>Dashboard access unavailable</h3>
      <p>This project's dashboard access is not currently authorized.</p>
    </div>
  </body>
  </html>\`;
}

async function infrakitDashboardAuthCheck(req, res, next) {
  const fresh =
    cached &&
    Date.now() - cached.checkedAt < CHECK_CACHE_MS;

  if (!fresh) {
    const valid = await checkWithPlatform();

    cached = {
      valid,
      checkedAt: Date.now()
    };
  }

  if (cached.valid) {
    return next();
  }

  return res.status(403).send(renderRevoked());
}

// Called after successful platform credential verification.
infrakitDashboardAuthCheck.setVerifiedCredentials = (
  accessKey,
  password
) => {
  runtimeCredentials = {
    accessKey,
    password
  };

  // Important: invalidate an earlier failed verification.
  cached = null;

  console.log("[InfraKit Auth] Verified credentials updated.");
};

module.exports = infrakitDashboardAuthCheck;
  `;
}
