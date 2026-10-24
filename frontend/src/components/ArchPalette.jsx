import { useMemo, useState } from "react";
import Icon from "./Icon.jsx";
import { ARCH_COMPONENTS, CATEGORIES, categoryColor } from "../architectureCatalog.js";

export default function ArchPalette() {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(() => new Set());

  function onDragStart(e, type) {
    e.dataTransfer.setData("application/arch-node-type", type);
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
    const filtered = q ? ARCH_COMPONENTS.filter((c) => c.label.toLowerCase().includes(q)) : ARCH_COMPONENTS;
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: filtered.filter((c) => c.category === cat.id),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  return (
    <div className="palette arch-palette">
      <h3>System Design</h3>
      <p className="palette-hint">Drop as many as you like — connections are checked for you.</p>
      <input
        className="palette-search"
        type="text"
        placeholder="Search components…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {grouped.map((cat) => {
        const isCollapsed = collapsed.has(cat.id) && !query;
        return (
          <div key={cat.id} className="palette-category">
            <button className="palette-category-header" onClick={() => toggle(cat.id)} style={{ "--accent": cat.color }}>
              <span className="palette-category-dot" style={{ background: cat.color }} />
              <span>{cat.label}</span>
              <span className="palette-category-count">{cat.items.length}</span>
              <span className={`palette-category-chevron ${isCollapsed ? "" : "open"}`}>›</span>
            </button>
            {!isCollapsed && (
              <div className="palette-category-items">
                {cat.items.map((c) => (
                  <div
                    key={c.id}
                    className="palette-item"
                    draggable
                    onDragStart={(e) => onDragStart(e, c.id)}
                    title={c.label}
                    style={{ "--accent": categoryColor(c.category) }}
                  >
                    <span className="palette-item-icon">
                      <Icon name={c.icon} size={15} strokeWidth={2} />
                    </span>
                    <span className="palette-item-text">
                      <span className="palette-item-label">{c.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {grouped.length === 0 && <p className="palette-hint">No components match "{query}".</p>}
    </div>
  );
}


// import { useMemo, useState } from "react";
// import Icon from "./Icon.jsx";
// import { ARCH_COMPONENTS, CATEGORIES, categoryColor } from "../architectureCatalog.js";

// export default function ArchPalette() {
//   const [query, setQuery] = useState("");
//   const [collapsed, setCollapsed] = useState(() => new Set());

//   function onDragStart(e, type) {
//     e.dataTransfer.setData("application/arch-node-type", type);
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
//     const filtered = q ? ARCH_COMPONENTS.filter((c) => c.label.toLowerCase().includes(q)) : ARCH_COMPONENTS;
//     return CATEGORIES.map((cat) => ({
//       ...cat,
//       items: filtered.filter((c) => c.category === cat.id),
//     })).filter((cat) => cat.items.length > 0);
//   }, [query]);

//   return (
//     <div className="palette arch-palette">
//       <h3>System Design</h3>
//       <p className="palette-hint">Drop as many as you like — connections are checked for you.</p>
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
//                     className="palette-item"
//                     draggable
//                     onDragStart={(e) => onDragStart(e, c.id)}
//                     title={c.label}
//                     style={{ "--accent": categoryColor(c.category) }}
//                   >
//                     <span className="palette-item-icon">
//                       <Icon name={c.icon} size={15} strokeWidth={2} />
//                     </span>
//                     <span className="palette-item-text">
//                       <span className="palette-item-label">{c.label}</span>
//                     </span>
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
