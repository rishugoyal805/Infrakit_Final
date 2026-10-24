import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { api } from "../api.js";
import ExportPreviewModal from "../components/ExportPreviewModal.jsx";
import ComponentPalette from "../components/ComponentPalette.jsx";
import PropertyPanel from "../components/PropertyPanel.jsx";
import ArchPropertyPanel from "../components/ArchPropertyPanel.jsx";
import DashboardAccessModal from "../components/DashboardAccessModal.jsx";
import PackageNode from "../components/nodes/PackageNode.jsx";
import ArchNode from "../components/nodes/ArchNode.jsx";
import ProviderSelector from "../components/ProviderSelector.jsx";
import { providerColor } from "../providerSkins.js";
import {
  ARCH_COMPONENT_MAP,
  isValidArchConnection,
} from "../architectureCatalog.js";

let idCounter = 1;

export default function Editor() {
  const { id } = useParams();
  const [catalog, setCatalog] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [provider, setProvider] = useState("generic");
  const [dashboardEnabled, setDashboardEnabled] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [exportPreview, setExportPreview] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [saveState, setSaveState] = useState("idle");
  const [connectionError, setConnectionError] = useState(null);
  const wrapperRef = useRef(null);
  const [flowInstance, setFlowInstance] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);

  const sidebarResizingRef = useRef(false);

  function startSidebarResize(e) {
    e.preventDefault();
    sidebarResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  useEffect(() => {
    function handleMouseMove(e) {
      if (sidebarResizingRef.current) {
        setSidebarWidth(Math.min(Math.max(e.clientX, 200), 500));
      }
    }
    function handleMouseUp() {
      sidebarResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    Promise.all([api.catalog(), api.getProject(id)]).then(([c, p]) => {
      setCatalog(c.catalog);
      setProjectName(p.project.name);
      const g = p.project.graph || { nodes: [], edges: [] };
      const loadedProvider = g.settings?.provider || "generic";
      const loadedNodes = (g.nodes || []).map((n) => ({
        ...n,
        data: {
          ...n.data,
          kind:
            n.data.kind || (c.catalog[n.data.pkgType] ? "infrakit" : "generic"),
          provider: loadedProvider,
        },
      }));

      const loadedEdges = (g.edges || []).map((edge, index) => ({
        id: edge.id || `e${index + 1}`,
        source: String(edge.source),
        target: String(edge.target),
        animated: true,
      }));

      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setProvider(loadedProvider);
      setDashboardEnabled(!!g.settings?.dashboardEnabled);
      idCounter = loadedNodes.length + 1;
    });
  }, [id]);

  const nodeTypes = useMemo(
    () => ({ package: PackageNode, arch: ArchNode }),
    [],
  );

  const onNodesChange = useCallback(
    (changes) => setNodes((ns) => applyNodeChanges(changes, ns)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((es) => applyEdgeChanges(changes, es)),
    [],
  );

  const onConnect = useCallback(
    (connection) => {
      if (connection.source === connection.target) {
        setConnectionError("A component can't connect to itself.");
        return;
      }

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      const bothGeneric =
        sourceNode?.data.kind === "generic" &&
        targetNode?.data.kind === "generic";
      if (bothGeneric) {
        const ok = isValidArchConnection(
          sourceNode.data.archType,
          targetNode.data.archType,
        );
        if (!ok) {
          const sourceLabel =
            ARCH_COMPONENT_MAP[sourceNode.data.archType]?.label ||
            sourceNode.data.archType;
          const targetLabel =
            ARCH_COMPONENT_MAP[targetNode.data.archType]?.label ||
            targetNode.data.archType;
          setConnectionError(
            `${sourceLabel} → ${targetLabel} isn't a typical connection.`,
          );
          return;
        }
      }

      setConnectionError(null);
      setEdges((es) => addEdge({ ...connection, animated: true }, es));
    },
    [nodes],
  );

  useEffect(() => {
    if (!connectionError) return;
    const t = setTimeout(() => setConnectionError(null), 3200);
    return () => clearTimeout(t);
  }, [connectionError]);

  function onDrop(e) {
    e.preventDefault();
    if (!flowInstance) return;

    const infrakitType = e.dataTransfer.getData(
      "application/infrakit-node-type",
    );
    if (!infrakitType || !catalog[infrakitType]) return;

    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = flowInstance.screenToFlowPosition({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    });
    const newId = `n${idCounter++}`;

    const siblingCount = nodes.filter(
      (n) => n.data.kind === "infrakit" && n.data.pkgType === infrakitType,
    ).length;
    const defaultNickname =
      siblingCount === 0
        ? catalog[infrakitType].label
        : `${catalog[infrakitType].label} ${siblingCount + 1}`;
    const defaults = Object.fromEntries(
      catalog[infrakitType].fields.map((f) => [f.key, f.default]),
    );

    setNodes((ns) => [
      ...ns,
      {
        id: newId,
        type: "package",
        position,
        data: {
          kind: "infrakit",
          pkgType: infrakitType,
          nickname: defaultNickname,
          values: defaults,
          provider,
        },
      },
    ]);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleProviderChange(next) {
    setProvider(next);
    setNodes((ns) =>
      ns.map((n) =>
        n.data.kind === "infrakit"
          ? { ...n, data: { ...n.data, provider: next } }
          : n,
      ),
    );
  }

  function updateInfrakitNode(nodeId, patch) {
    setNodes((ns) =>
      ns.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    );
  }

  function updateArchFields(nodeId, patch) {
    setNodes((ns) =>
      ns.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    );
  }

  async function save() {
    setSaveState("saving");
    const graph = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data:
          n.data.kind === "infrakit"
            ? {
                kind: "infrakit",
                pkgType: n.data.pkgType,
                nickname: n.data.nickname,
                values: n.data.values,
              }
            : {
                kind: "generic",
                archType: n.data.archType,
                customLabel: n.data.customLabel,
                notes: n.data.notes,
              },
      })),
      edges: edges.map((e) => ({ source: e.source, target: e.target })),
      settings: { provider, dashboardEnabled },
    };
    await api.saveProject(id, graph);
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1500);
  }

  async function doExport() {
    setExportLoading(true);
    try {
      await save();
      const data = await api.previewExport(id);
      setExportPreview(data.files);
    } catch (err) {
      alert(err.message || "Export preview failed");
    } finally {
      setExportLoading(false);
    }
  }

  async function confirmDownload() {
    setDownloading(true);
    try {
      await api.exportProject(id);
      setExportPreview(null);
    } catch (err) {
      alert(err.message || "Export failed");
    } finally {
      setDownloading(false);
    }
  }

  if (!catalog) {
    return (
      <div className="flex h-screen items-center justify-center text-[14px] text-ink-soft">
        Loading editor…
      </div>
    );
  }

  const selectedNode = nodes.find((n) => n.id === selectedId) || null;
  const selectedInfrakitPkg =
    selectedNode?.data.kind === "infrakit"
      ? catalog[selectedNode.data.pkgType]
      : null;
  const accent = providerColor(provider);
  const infrakitNodeCount = nodes.filter(
    (n) => n.data.kind === "infrakit",
  ).length;
  const canExport = infrakitNodeCount > 0 || dashboardEnabled;

  return (
    <div className="flex h-screen flex-col">
      <header className="z-[5] flex items-center gap-4 border-b border-border bg-white px-4 py-2.5">
        <Link
          to="/"
          className="whitespace-nowrap text-[13px] text-ink-soft hover:text-ink"
        >
          ← Projects
        </Link>
        <h2 className="m-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-ink">
          {projectName}
        </h2>
        <ProviderSelector provider={provider} onChange={handleProviderChange} />
        <div className="flex gap-2">
          <button
            onClick={save}
            className={`rounded-[8px] border px-4 py-2 text-[13px] font-medium transition-all duration-150 ${
              saveState === "saved"
                ? "border-[#bbe5c3] bg-[#f0faf2] text-[#1a7f37]"
                : "border-[#333338] bg-white text-[#333338] hover:bg-[#333338] hover:text-white hover:border-[#333338] hover:shadow-[0_2px_6px_rgba(0,0,0,0.18)] active:shadow-none"
            }`}
          >
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "✓ Saved"
                : "Save"}
          </button>
          <button
            onClick={doExport}
            disabled={!canExport || exportLoading}
            title={
              !canExport
                ? "Add at least one InfraKit package (or enable the dashboard) to export"
                : ""
            }
            className="
              rounded-[8px] border border-[#333338] bg-white px-4 py-2 text-[13px] font-medium text-[#333338] transition-all duration-150 hover:bg-[#333338] hover:text-white hover:border-[#333338] hover:shadow-[0_2px_6px_rgba(0,0,0,0.18)] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#333338] disabled:hover:border-[#333338] disabled:hover:shadow-none "
          >
            {exportLoading ? "Preparing…" : "Export"}
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        <div
          className="flex shrink-0 flex-col overflow-y-auto border-r border-border bg-white"
          style={{ width: `${sidebarWidth}px` }}
        >
          <ComponentPalette catalog={catalog} provider={provider} />

          {false && (
            <div className="border-t border-border p-3">
              <label className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
                <input
                  type="checkbox"
                  checked={dashboardEnabled}
                  onChange={(e) => setDashboardEnabled(e.target.checked)}
                />
                <span>Enable Dashboard</span>
              </label>
              <p className="mt-2 text-[11px] leading-snug text-ink-soft">
                Dashboard visualizes the whole app — it's not a wired component.
                Turning this on pulls in{" "}
                <code className="rounded bg-[#f2f2f4] px-1 font-mono text-[10.5px]">
                  @infrakit/core
                </code>{" "}
                automatically and adds the signed-token dashboard-auth files to
                your export.
              </p>
              {dashboardEnabled && (
                <button
                  onClick={() => setShowAccessModal(true)}
                  className="mt-2.5 w-full rounded-[7px] border border-border bg-white py-2 text-[12px] font-semibold text-ink hover:bg-[#f7f7f8]"
                >
                  View / Reset Dashboard Access →
                </button>
              )}
            </div>
          )}
        </div>

        {showAccessModal && (
          <DashboardAccessModal
            projectId={id}
            onClose={() => setShowAccessModal(false)}
          />
        )}
        {exportPreview && (
          <ExportPreviewModal
            files={exportPreview}
            onClose={() => setExportPreview(null)}
            onDownload={confirmDownload}
            downloading={downloading}
          />
        )}

        <div
          onMouseDown={startSidebarResize}
          title="Drag to resize sidebar"
          className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-border"
        />

        <div
          ref={wrapperRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="relative flex-1 bg-canvas"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setFlowInstance}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            defaultEdgeOptions={{ style: { stroke: accent, strokeWidth: 1.5 } }}
            fitView
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={18}
              size={1}
              color="#d8d8dc"
            />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor={accent}
              maskColor="rgba(247,247,248,0.7)"
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 8,
              }}
            />
          </ReactFlow>

          {nodes.length === 0 && !dashboardEnabled && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-full bg-white/60 px-3.5 py-1.5 text-[13.5px] text-gray-400">
                Drag an InfraKit package from the left to get started.
              </p>
            </div>
          )}

          {connectionError && (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#1a1a1a] px-4 py-2.5 text-[12.5px] text-white shadow-lg">
              {connectionError}
            </div>
          )}
        </div>

        {selectedNode?.data.kind === "infrakit" && (
          <PropertyPanel
            node={selectedNode}
            pkg={selectedInfrakitPkg}
            onChange={updateInfrakitNode}
            onClose={() => setSelectedId(null)}
          />
        )}
        {selectedNode?.data.kind === "generic" && (
          <ArchPropertyPanel
            node={selectedNode}
            onChange={updateArchFields}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}


// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import {
//   ReactFlow,
//   Background,
//   BackgroundVariant,
//   Controls,
//   MiniMap,
//   addEdge,
//   applyNodeChanges,
//   applyEdgeChanges,
// } from "@xyflow/react";
// import "./Editor.css";
// import { api } from "../api.js";
// import ComponentPalette from "../components/ComponentPalette.jsx";
// import PropertyPanel from "../components/PropertyPanel.jsx";
// import ArchPropertyPanel from "../components/ArchPropertyPanel.jsx";
// import DashboardAccessModal from "../components/DashboardAccessModal.jsx";
// import PackageNode from "../components/nodes/PackageNode.jsx";
// import ArchNode from "../components/nodes/ArchNode.jsx";
// import ProviderSelector from "../components/ProviderSelector.jsx";
// import { providerColor } from "../providerSkins.js";
// import {
//   ARCH_COMPONENT_MAP,
//   isValidArchConnection,
// } from "../architectureCatalog.js";

// let idCounter = 1;

// export default function Editor() {
//   const { id } = useParams();
//   const [catalog, setCatalog] = useState(null);
//   const [projectName, setProjectName] = useState("");
//   const [nodes, setNodes] = useState([]);
//   const [edges, setEdges] = useState([]);
//   const [provider, setProvider] = useState("generic");
//   const [dashboardEnabled, setDashboardEnabled] = useState(false);
//   const [showAccessModal, setShowAccessModal] = useState(false);
//   const [selectedId, setSelectedId] = useState(null);
//   const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
//   const [connectionError, setConnectionError] = useState(null);
//   const wrapperRef = useRef(null);
//   const [flowInstance, setFlowInstance] = useState(null);
//   const [sidebarWidth, setSidebarWidth] = useState(280);

//   // Sidebar-width resizer (kept from the version you built — the palette no
//   // longer needs an internal split, since InfraKit packages and "not
//   // available yet" concepts now share one categorized, scrollable list).
//   const sidebarResizingRef = useRef(false);

//   function startSidebarResize(e) {
//     e.preventDefault();
//     sidebarResizingRef.current = true;
//     document.body.style.cursor = "col-resize";
//     document.body.style.userSelect = "none";
//   }

//   useEffect(() => {
//     function handleMouseMove(e) {
//       if (sidebarResizingRef.current) {
//         setSidebarWidth(Math.min(Math.max(e.clientX, 200), 500));
//       }
//     }
//     function handleMouseUp() {
//       sidebarResizingRef.current = false;
//       document.body.style.cursor = "";
//       document.body.style.userSelect = "";
//     }
//     window.addEventListener("mousemove", handleMouseMove);
//     window.addEventListener("mouseup", handleMouseUp);
//     return () => {
//       window.removeEventListener("mousemove", handleMouseMove);
//       window.removeEventListener("mouseup", handleMouseUp);
//     };
//   }, []);

//   useEffect(() => {
//     Promise.all([api.catalog(), api.getProject(id)]).then(([c, p]) => {
//       setCatalog(c.catalog);
//       setProjectName(p.project.name);
//       const g = p.project.graph || { nodes: [], edges: [] };
//       // Back-compat: graphs saved before "kind"/"nickname" existed — infer
//       // kind from whether the node's type is a known InfraKit package, and
//       // default nickname to the package label so old nodes still show
//       // something sensible instead of a blank name.
//       const loadedNodes = (g.nodes || []).map((n) => ({
//         ...n,
//         data: {
//           ...n.data,
//           kind:
//             n.data.kind || (c.catalog[n.data.pkgType] ? "infrakit" : "generic"),
//         },
//       }));

//       const loadedEdges = (g.edges || []).map((edge, index) => ({
//         id: edge.id || `e${index + 1}`,
//         source: String(edge.source),
//         target: String(edge.target),
//         animated: true,
//       }));

//       setNodes(loadedNodes);
//       setEdges(loadedEdges);
//       setProvider(g.settings?.provider || "generic");
//       setDashboardEnabled(!!g.settings?.dashboardEnabled);
//       idCounter = loadedNodes.length + 1;
//     });
//   }, [id]);

//   const nodeTypes = useMemo(
//     () => ({
//       package: (props) => <PackageNode {...props} provider={provider} />,
//       arch: (props) => <ArchNode {...props} />,
//     }),
//     [provider],
//   );

//   const onNodesChange = useCallback(
//     (changes) => setNodes((ns) => applyNodeChanges(changes, ns)),
//     [],
//   );
//   const onEdgesChange = useCallback(
//     (changes) => setEdges((es) => applyEdgeChanges(changes, es)),
//     [],
//   );

//   const onConnect = useCallback(
//     (connection) => {
//       if (connection.source === connection.target) {
//         setConnectionError("A component can't connect to itself.");
//         return;
//       }

//       const sourceNode = nodes.find((n) => n.id === connection.source);
//       const targetNode = nodes.find((n) => n.id === connection.target);

//       // InfraKit package nodes keep the spec's original rule: edges only
//       // set require()/wiring order, so any connection between them is
//       // allowed. Real validation only kicks in when BOTH ends are generic
//       // system-design nodes left over from a project saved before this
//       // update — the palette no longer offers new ones to create.
//       const bothGeneric =
//         sourceNode?.data.kind === "generic" &&
//         targetNode?.data.kind === "generic";
//       if (bothGeneric) {
//         const ok = isValidArchConnection(
//           sourceNode.data.archType,
//           targetNode.data.archType,
//         );
//         if (!ok) {
//           const sourceLabel =
//             ARCH_COMPONENT_MAP[sourceNode.data.archType]?.label ||
//             sourceNode.data.archType;
//           const targetLabel =
//             ARCH_COMPONENT_MAP[targetNode.data.archType]?.label ||
//             targetNode.data.archType;
//           setConnectionError(
//             `${sourceLabel} → ${targetLabel} isn't a typical connection.`,
//           );
//           return;
//         }
//       }

//       setConnectionError(null);
//       setEdges((es) => addEdge({ ...connection, animated: true }, es));
//     },
//     [nodes],
//   );

//   useEffect(() => {
//     if (!connectionError) return;
//     const t = setTimeout(() => setConnectionError(null), 3200);
//     return () => clearTimeout(t);
//   }, [connectionError]);

//   function onDrop(e) {
//     e.preventDefault();
//     if (!flowInstance) return;

//     const infrakitType = e.dataTransfer.getData(
//       "application/infrakit-node-type",
//     );
//     if (!infrakitType || !catalog[infrakitType]) return; // "not available yet" items are non-draggable — nothing to handle here

//     const bounds = wrapperRef.current.getBoundingClientRect();
//     const position = flowInstance.screenToFlowPosition({
//       x: e.clientX - bounds.left,
//       y: e.clientY - bounds.top,
//     });
//     const newId = `n${idCounter++}`;

//     // Multiple instances of the same InfraKit package are allowed — each
//     // gets its own nickname (auto-numbered, editable) and its own config
//     // values. See the export-side README note on what this does and
//     // doesn't mean for the real package's current runtime behavior.
//     const siblingCount = nodes.filter(
//       (n) => n.data.kind === "infrakit" && n.data.pkgType === infrakitType,
//     ).length;
//     const defaultNickname =
//       siblingCount === 0
//         ? catalog[infrakitType].label
//         : `${catalog[infrakitType].label} ${siblingCount + 1}`;
//     const defaults = Object.fromEntries(
//       catalog[infrakitType].fields.map((f) => [f.key, f.default]),
//     );

//     setNodes((ns) => [
//       ...ns,
//       {
//         id: newId,
//         type: "package",
//         position,
//         data: {
//           kind: "infrakit",
//           pkgType: infrakitType,
//           nickname: defaultNickname,
//           values: defaults,
//         },
//       },
//     ]);
//   }

//   function onDragOver(e) {
//     e.preventDefault();
//     e.dataTransfer.dropEffect = "move";
//   }

//   function updateInfrakitNode(nodeId, patch) {
//     setNodes((ns) =>
//       ns.map((n) =>
//         n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
//       ),
//     );
//   }

//   function updateArchFields(nodeId, patch) {
//     setNodes((ns) =>
//       ns.map((n) =>
//         n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
//       ),
//     );
//   }

//   async function save() {
//     setSaveState("saving");
//     const graph = {
//       nodes: nodes.map((n) => ({
//         id: n.id,
//         type: n.type,
//         position: n.position,
//         data:
//           n.data.kind === "infrakit"
//             ? {
//                 kind: "infrakit",
//                 pkgType: n.data.pkgType,
//                 nickname: n.data.nickname,
//                 values: n.data.values,
//               }
//             : {
//                 kind: "generic",
//                 archType: n.data.archType,
//                 customLabel: n.data.customLabel,
//                 notes: n.data.notes,
//               },
//       })),
//       edges: edges.map((e) => ({ source: e.source, target: e.target })),
//       settings: { provider, dashboardEnabled },
//     };
//     await api.saveProject(id, graph);
//     setSaveState("saved");
//     setTimeout(() => setSaveState("idle"), 1500);
//   }

//   async function doExport() {
//     await save();
//     await api.exportProject(id);
//   }

//   if (!catalog) return <div className="loading-screen">Loading editor…</div>;

//   const selectedNode = nodes.find((n) => n.id === selectedId) || null;
//   const selectedInfrakitPkg =
//     selectedNode?.data.kind === "infrakit"
//       ? catalog[selectedNode.data.pkgType]
//       : null;
//   const accent = providerColor(provider);
//   const infrakitNodeCount = nodes.filter(
//     (n) => n.data.kind === "infrakit",
//   ).length;
//   const canExport = infrakitNodeCount > 0 || dashboardEnabled;

//   return (
//     <div className="editor-layout" style={{ "--accent": accent }}>
//       <header className="editor-header">
//         <Link to="/" className="back-link">
//           ← Projects
//         </Link>
//         <h2>{projectName}</h2>
//         <ProviderSelector provider={provider} onChange={setProvider} />
//         <div className="header-actions">
//           <button
//             onClick={save}
//             className={saveState === "saved" ? "saved" : ""}
//           >
//             {saveState === "saving"
//               ? "Saving…"
//               : saveState === "saved"
//                 ? "✓ Saved"
//                 : "Save"}
//           </button>
//           <button
//             onClick={doExport}
//             className="primary"
//             disabled={!canExport}
//             title={
//               !canExport
//                 ? "Add at least one InfraKit package (or enable the dashboard) to export"
//                 : ""
//             }
//           >
//             Export
//           </button>
//         </div>
//       </header>

//       <div className="editor-body">
//         <div className="sidebar-scroll" style={{ width: `${sidebarWidth}px` }}>
//           <ComponentPalette catalog={catalog} provider={provider} />

//           <div className="dashboard-toggle-row">
//             <label className="dashboard-toggle">
//               <input
//                 type="checkbox"
//                 checked={dashboardEnabled}
//                 onChange={(e) => setDashboardEnabled(e.target.checked)}
//               />
//               <span>Enable Dashboard</span>
//             </label>
//             <p className="palette-hint">
//               Dashboard visualizes the whole app — it's not a wired component.
//               Turning this on pulls in <code>@infrakit/core</code> automatically
//               and adds the signed-token dashboard-auth files to your export.
//             </p>
//             {dashboardEnabled && (
//               <button
//                 className="dashboard-access-btn"
//                 onClick={() => setShowAccessModal(true)}
//               >
//                 View / Reset Dashboard Access →
//               </button>
//             )}
//           </div>
//         </div>

//         {showAccessModal && (
//           <DashboardAccessModal
//             projectId={id}
//             onClose={() => setShowAccessModal(false)}
//           />
//         )}

//         <div
//           className="sidebar-width-resizer"
//           onMouseDown={startSidebarResize}
//           title="Drag to resize sidebar"
//         />

//         <div
//           className="canvas-wrapper"
//           ref={wrapperRef}
//           onDrop={onDrop}
//           onDragOver={onDragOver}
//         >
//           <ReactFlow
//             nodes={nodes}
//             edges={edges}
//             nodeTypes={nodeTypes}
//             onNodesChange={onNodesChange}
//             onEdgesChange={onEdgesChange}
//             onConnect={onConnect}
//             onInit={setFlowInstance}
//             onNodeClick={(_, node) => setSelectedId(node.id)}
//             onPaneClick={() => setSelectedId(null)}
//             defaultEdgeOptions={{ style: { stroke: accent, strokeWidth: 1.5 } }}
//             fitView
//           >
//             <Background
//               variant={BackgroundVariant.Dots}
//               gap={18}
//               size={1}
//               color="#d8d8dc"
//             />
//             <Controls showInteractive={false} />
//             <MiniMap
//               pannable
//               zoomable
//               nodeColor={accent}
//               maskColor="rgba(247,247,248,0.7)"
//               style={{
//                 background: "#fff",
//                 border: "1px solid #eee",
//                 borderRadius: 8,
//               }}
//             />
//           </ReactFlow>

//           {nodes.length === 0 && !dashboardEnabled && (
//             <div className="canvas-empty-hint">
//               <p>Drag an InfraKit package from the left to get started.</p>
//             </div>
//           )}

//           {connectionError && (
//             <div className="connection-toast">{connectionError}</div>
//           )}
//         </div>

//         {selectedNode?.data.kind === "infrakit" && (
//           <PropertyPanel
//             node={selectedNode}
//             pkg={selectedInfrakitPkg}
//             onChange={updateInfrakitNode}
//             onClose={() => setSelectedId(null)}
//           />
//         )}
//         {selectedNode?.data.kind === "generic" && (
//           <ArchPropertyPanel
//             node={selectedNode}
//             onChange={updateArchFields}
//             onClose={() => setSelectedId(null)}
//           />
//         )}
//       </div>
//     </div>
//   );
// }
