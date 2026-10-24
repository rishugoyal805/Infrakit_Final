import { useMemo, useState } from "react";
import Icon from "./Icon.jsx";
import { skinFor } from "../providerSkins.js";
import {
  ARCH_COMPONENTS,
  CATEGORIES,
  INFRAKIT_DISPLAY,
  DISABLED_INFRAKIT_PACKAGES,
  categoryColor,
} from "../architectureCatalog.js";

const EXCLUDED_FROM_PALETTE = new Set(["core", "dashboard"]);

export default function ComponentPalette({ catalog, provider }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(() => new Set());

  const items = useMemo(() => {
    const available = Object.keys(catalog)
      .filter((type) => !EXCLUDED_FROM_PALETTE.has(type))
      .map((type) => ({
        id: type,
        label: skinFor(type, provider).label,
        icon: INFRAKIT_DISPLAY[type]?.icon || "Box",
        category: INFRAKIT_DISPLAY[type]?.category || "compute",
        available: true,
      }));
    const disabled = DISABLED_INFRAKIT_PACKAGES.map((c) => ({
      ...c,
      available: false,
      badge: "Disabled",
      reason: `${c.label} — disabled for this build`,
    }));
    const planned = ARCH_COMPONENTS.map((c) => ({
      ...c,
      available: false,
      badge: "Soon",
      reason: `${c.label} — not available yet, no InfraKit package for this yet`,
    }));
    return [...available, ...disabled, ...planned];
  }, [catalog, provider]);

  function onDragStart(e, id) {
    e.dataTransfer.setData("application/infrakit-node-type", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function toggle(categoryId) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  }

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? items.filter((c) => c.label.toLowerCase().includes(q)) : items;
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: filtered.filter((c) => c.category === cat.id).sort((a, b) => Number(b.available) - Number(a.available)),
    })).filter((cat) => cat.items.length > 0);
  }, [items, query]);

  return (
    <div className="flex flex-col p-3">
      <h3 className="mx-2 mb-2.5 mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Components</h3>
      <p className="mx-2 -mt-1 mb-2.5 text-[11px] leading-snug text-ink-soft">
        Solid = ready to use, from your InfraKit packages. Faded = planned or disabled for this build.
      </p>
      <input
        type="text"
        placeholder="Search components…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mx-1 mb-3 rounded-[7px] border border-border px-2.5 py-1.5 text-[12.5px] focus:border-ink focus:outline-none"
      />

      {grouped.map((cat) => {
        const isCollapsed = collapsed.has(cat.id) && !query;
        return (
          <div key={cat.id} className="mb-0.5">
            <button
              onClick={() => toggle(cat.id)}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-soft hover:bg-[#f5f5f7] hover:text-ink"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cat.color }} />
              <span>{cat.label}</span>
              <span className="ml-auto rounded-full bg-[#f0f0f2] px-1.5 py-px text-[10px] font-medium text-ink-soft">{cat.items.length}</span>
              <span className={`text-[13px] text-ink-soft transition-transform ${isCollapsed ? "" : "rotate-90"}`}>›</span>
            </button>
            {!isCollapsed && (
              <div className="py-0.5 pb-1.5">
                {cat.items.map((c) => {
                  const accent = categoryColor(c.category);
                  return (
                    <div
                      key={c.id}
                      draggable={c.available}
                      onDragStart={(e) => c.available && onDragStart(e, c.id)}
                      title={c.available ? c.label : c.reason}
                      style={{ "--accent": accent }}
                      className={`mb-1 flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 transition-colors ${
                        c.available
                          ? "cursor-grab bg-[#fafafa] hover:border-[var(--accent)] hover:bg-white"
                          : "cursor-not-allowed bg-[#fafafa] opacity-35"
                      }`}
                    >
                      <span
                        style={{ background: `${accent}24`, color: accent }}
                        className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md"
                      >
                        <Icon name={c.icon} size={15} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">{c.label}</span>
                      {!c.available && (
                        <span className="shrink-0 rounded-[5px] bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                          {c.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {grouped.length === 0 && <p className="mx-2 text-[11px] text-ink-soft">No components match "{query}".</p>}
    </div>
  );
}

// import { useMemo, useState } from "react";
// import Icon from "./Icon.jsx";
// import { skinFor } from "../providerSkins.js";
// import {
//   ARCH_COMPONENTS,
//   CATEGORIES,
//   INFRAKIT_DISPLAY,
//   categoryColor,
// } from "../architectureCatalog.js";

// const EXCLUDED_FROM_PALETTE = new Set(["core", "dashboard"]); // core is implicit, dashboard is a checkbox — see Editor

// export default function ComponentPalette({ catalog, provider }) {
//   const [query, setQuery] = useState("");
//   const [collapsed, setCollapsed] = useState(() => new Set());

//   const items = useMemo(() => {
//     const available = Object.keys(catalog)
//       .filter((type) => !EXCLUDED_FROM_PALETTE.has(type))
//       .map((type) => ({
//         id: type,
//         label: skinFor(type, provider).label,
//         icon: INFRAKIT_DISPLAY[type]?.icon || "Box",
//         category: INFRAKIT_DISPLAY[type]?.category || "compute",
//         available: true,
//       }));
//     const planned = ARCH_COMPONENTS.map((c) => ({ ...c, available: false }));
//     return [...available, ...planned];
//   }, [catalog, provider]);

//   function onDragStart(e, id) {
//     e.dataTransfer.setData("application/infrakit-node-type", id);
//     e.dataTransfer.effectAllowed = "move";
//   }

//   function toggle(categoryId) {
//     setCollapsed((prev) => {
//       const next = new Set(prev);
//       next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
//       return next;
//     });
//   }

//   const grouped = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     const filtered = q ? items.filter((c) => c.label.toLowerCase().includes(q)) : items;
//     return CATEGORIES.map((cat) => ({
//       ...cat,
//       items: filtered.filter((c) => c.category === cat.id).sort((a, b) => Number(b.available) - Number(a.available)),
//     })).filter((cat) => cat.items.length > 0);
//   }, [items, query]);

//   return (
//     <div className="palette component-palette">
//       <h3>Components</h3>
//       <p className="palette-hint">
//         Solid = ready to use, from your InfraKit packages. Faded = planned, not built yet.
//       </p>
//       <input
//         className="palette-search"
//         type="text"
//         placeholder="Search components…"
//         value={query}
//         onChange={(e) => setQuery(e.target.value)}
//       />

//       {grouped.map((cat) => {
//         const isCollapsed = collapsed.has(cat.id) && !query;
//         return (
//           <div key={cat.id} className="palette-category">
//             <button className="palette-category-header" onClick={() => toggle(cat.id)} style={{ "--accent": cat.color }}>
//               <span className="palette-category-dot" style={{ background: cat.color }} />
//               <span>{cat.label}</span>
//               <span className="palette-category-count">{cat.items.length}</span>
//               <span className={`palette-category-chevron ${isCollapsed ? "" : "open"}`}>›</span>
//             </button>
//             {!isCollapsed && (
//               <div className="palette-category-items">
//                 {cat.items.map((c) => (
//                   <div
//                     key={c.id}
//                     className={`palette-item ${c.available ? "" : "disabled"}`}
//                     draggable={c.available}
//                     onDragStart={(e) => c.available && onDragStart(e, c.id)}
//                     title={c.available ? c.label : `${c.label} — not available yet, no InfraKit package for this yet`}
//                     style={{ "--accent": categoryColor(c.category) }}
//                   >
//                     <span className="palette-item-icon">
//                       <Icon name={c.icon} size={15} strokeWidth={2} />
//                     </span>
//                     <span className="palette-item-text">
//                       <span className="palette-item-label">{c.label}</span>
//                     </span>
//                     {!c.available && <span className="palette-item-badge">Soon</span>}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         );
//       })}

//       {grouped.length === 0 && <p className="palette-hint">No components match "{query}".</p>}
//     </div>
//   );
// }
