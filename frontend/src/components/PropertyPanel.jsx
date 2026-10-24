export default function PropertyPanel({ node, pkg, onChange, onClose }) {
  if (!node) return null;

  function setField(key, value) {
    onChange(node.id, { values: { ...node.data.values, [key]: value } });
  }

  const inputClass =
    "rounded-[7px] border border-border px-2.5 py-2 text-[13px] focus:border-ink focus:outline-none";

  return (
    <aside className="w-[300px] shrink-0 overflow-y-auto border-l border-border bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-[14px] font-semibold text-ink">{pkg.label}</h3>
        <button onClick={onClose} className="text-xl leading-none text-ink-soft hover:text-ink">×</button>
      </div>
      <p className="mb-4 mt-1 text-[12.5px] text-ink-soft">{pkg.description}</p>

      <label className="mb-3.5 flex flex-col gap-1.5 text-[12.5px]">
        <span className="font-semibold text-ink">Nickname</span>
        <input
          type="text"
          placeholder={pkg.label}
          value={node.data.nickname || ""}
          onChange={(e) => onChange(node.id, { nickname: e.target.value })}
          className={inputClass}
        />
      </label>

      {pkg.fields.length === 0 && <p className="text-[12.5px] text-ink-soft">No configurable fields for this node.</p>}

      {pkg.fields.map((f) => {
        const value = node.data.values?.[f.key] ?? f.default;
        return (
          <label key={f.key} className="mb-3.5 flex flex-col gap-1.5 text-[12.5px]">
            <span className="font-semibold text-ink">{f.label || f.key}</span>
            {f.type === "boolean" ? (
              <input type="checkbox" checked={!!value} onChange={(e) => setField(f.key, e.target.checked)} className="h-4 w-4" />
            ) : f.type === "number" ? (
              <input type="number" value={value} onChange={(e) => setField(f.key, Number(e.target.value))} className={inputClass} />
            ) : f.type === "json" ? (
              <textarea rows={6} value={value} onChange={(e) => setField(f.key, e.target.value)} className={`${inputClass} resize-y font-mono text-[12px]`} />
            ) : (
              <input type="text" value={value} onChange={(e) => setField(f.key, e.target.value)} className={inputClass} />
            )}
          </label>
        );
      })}
    </aside>
  );
}

// export default function PropertyPanel({ node, pkg, onChange, onClose }) {
//   if (!node) return null;

//   function setField(key, value) {
//     onChange(node.id, { values: { ...node.data.values, [key]: value } });
//   }

//   return (
//     <aside className="property-panel">
//       <div className="property-panel-header">
//         <h3>{pkg.label}</h3>
//         <button onClick={onClose}>×</button>
//       </div>
//       <p className="muted">{pkg.description}</p>

//       <label className="property-field">
//         <span>Nickname</span>
//         <input
//           type="text"
//           placeholder={pkg.label}
//           value={node.data.nickname || ""}
//           onChange={(e) => onChange(node.id, { nickname: e.target.value })}
//         />
//       </label>

//       {pkg.fields.length === 0 && <p className="muted">No configurable fields for this node.</p>}

//       {pkg.fields.map((f) => {
//         const value = node.data.values?.[f.key] ?? f.default;
//         return (
//           <label key={f.key} className="property-field">
//             <span>{f.label || f.key}</span>
//             {f.type === "boolean" ? (
//               <input
//                 type="checkbox"
//                 checked={!!value}
//                 onChange={(e) => setField(f.key, e.target.checked)}
//               />
//             ) : f.type === "number" ? (
//               <input
//                 type="number"
//                 value={value}
//                 onChange={(e) => setField(f.key, Number(e.target.value))}
//               />
//             ) : f.type === "json" ? (
//               <textarea
//                 rows={6}
//                 value={value}
//                 onChange={(e) => setField(f.key, e.target.value)}
//               />
//             ) : (
//               <input
//                 type="text"
//                 value={value}
//                 onChange={(e) => setField(f.key, e.target.value)}
//               />
//             )}
//           </label>
//         );
//       })}
//     </aside>
//   );
// }
