import { ARCH_COMPONENT_MAP } from "../architectureCatalog.js";

export default function ArchPropertyPanel({ node, onChange, onClose }) {
  if (!node) return null;
  const meta = ARCH_COMPONENT_MAP[node.data.archType] || { label: node.data.archType };
  const inputClass =
    "rounded-[7px] border border-border px-2.5 py-2 text-[13px] focus:border-ink focus:outline-none";

  return (
    <aside className="w-[300px] shrink-0 overflow-y-auto border-l border-border bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-[14px] font-semibold text-ink">{meta.label}</h3>
        <button onClick={onClose} className="text-xl leading-none text-ink-soft hover:text-ink">×</button>
      </div>
      <p className="mb-4 mt-1 text-[12.5px] text-ink-soft">
        Illustrative component — not exported as code. Give it a name so the
        diagram is easy to read (e.g. "Users DB" instead of just "SQL Database").
      </p>

      <label className="mb-3.5 flex flex-col gap-1.5 text-[12.5px]">
        <span className="font-semibold text-ink">Name</span>
        <input
          type="text"
          placeholder={meta.label}
          value={node.data.customLabel || ""}
          onChange={(e) => onChange(node.id, { customLabel: e.target.value })}
          className={inputClass}
        />
      </label>

      <label className="mb-3.5 flex flex-col gap-1.5 text-[12.5px]">
        <span className="font-semibold text-ink">Notes</span>
        <textarea
          rows={4}
          placeholder="Optional — anything worth remembering about this piece"
          value={node.data.notes || ""}
          onChange={(e) => onChange(node.id, { notes: e.target.value })}
          className={`${inputClass} resize-y`}
        />
      </label>
    </aside>
  );
}