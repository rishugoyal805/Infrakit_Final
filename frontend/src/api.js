
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  signup: (email, password) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  reauth: (password) => request("/auth/reauth", { method: "POST", body: JSON.stringify({ password }) }),

  catalog: () => request("/projects/catalog"),
  listProjects: () => request("/projects"),
  createProject: (name) => request("/projects", { method: "POST", body: JSON.stringify({ name }) }),
  getProject: (id) => request(`/projects/${id}`),
  saveProject: (id, graph) =>
    request(`/projects/${id}`, { method: "PUT", body: JSON.stringify({ graph }) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),

  getDashboardCredentials: (id) => request(`/projects/${id}/dashboard-credentials`),
  resetDashboardPassword: (id) =>
    request(`/projects/${id}/dashboard-credentials/reset-password`, { method: "POST" }),
  
  previewExport: (id) => request(`/projects/${id}/export/preview`),
  exportProject: async (id) => {
    const res = await fetch(`/api/projects/${id}/export`, { method: "POST", credentials: "include" });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infrakit-export-${id}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  },
};


// async function request(path, options = {}) {
//   const res = await fetch(`/api${path}`, {
//     credentials: "include",
//     headers: { "Content-Type": "application/json" },
//     ...options,
//   });
//   if (!res.ok) {
//     const body = await res.json().catch(() => ({}));
//     throw new Error(body.error || `Request failed: ${res.status}`);
//   }
//   return res.json();
// }

// export const api = {
//   signup: (email, password) =>
//     request("/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
//   login: (email, password) =>
//     request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
//   logout: () => request("/auth/logout", { method: "POST" }),
//   me: () => request("/auth/me"),
//   reauth: (password) => request("/auth/reauth", { method: "POST", body: JSON.stringify({ password }) }),

//   catalog: () => request("/projects/catalog"),
//   listProjects: () => request("/projects"),
//   createProject: (name) => request("/projects", { method: "POST", body: JSON.stringify({ name }) }),
//   getProject: (id) => request(`/projects/${id}`),
//   saveProject: (id, graph) =>
//     request(`/projects/${id}`, { method: "PUT", body: JSON.stringify({ graph }) }),
//   deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),

//   getDashboardCredentials: (id) => request(`/projects/${id}/dashboard-credentials`),
//   resetDashboardPassword: (id) =>
//     request(`/projects/${id}/dashboard-credentials/reset-password`, { method: "POST" }),

//   exportProject: async (id) => {
//     const res = await fetch(`/api/projects/${id}/export`, { method: "POST", credentials: "include" });
//     if (!res.ok) throw new Error("Export failed");
//     const blob = await res.blob();
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `infrakit-export-${id}.zip`;
//     a.click();
//     URL.revokeObjectURL(url);
//   },
// };
