import { Handle, Position } from "@xyflow/react";
import Icon from "../Icon.jsx";
import { ARCH_COMPONENT_MAP, categoryColor } from "../../architectureCatalog.js";

export default function ArchNode({ data, selected }) {
  const meta = ARCH_COMPONENT_MAP[data.archType] || { label: data.archType, icon: "Box", category: "client" };
  const accent = categoryColor(meta.category);
  const displayLabel = data.customLabel?.trim() || meta.label;

  return (
    <div
      style={{
        borderLeftColor: accent,
        outline: selected ? `2px solid ${accent}` : "none",
        outlineOffset: selected ? "2px" : "0",
      }}
      className="flex items-center gap-2.5 rounded-[10px] border border-dashed border-border border-l-[3px] bg-white py-2.5 pl-2.5 pr-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <Handle type="target" position={Position.Left} />
      <div
        style={{ background: `${accent}24`, color: accent }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]"
      >
        <Icon name={meta.icon} size={16} strokeWidth={2} />
      </div>
      <div className="flex flex-col">
        <div className="text-[12.5px] font-semibold leading-tight text-ink">{displayLabel}</div>
        <div className="font-mono text-[10px] text-ink-soft">{meta.label}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

// import { Handle, Position } from "@xyflow/react";
// import Icon from "../Icon.jsx";
// import { ARCH_COMPONENT_MAP, categoryColor } from "../../architectureCatalog.js";

// export default function ArchNode({ data, selected }) {
//   const meta = ARCH_COMPONENT_MAP[data.archType] || { label: data.archType, icon: "Box", category: "client" };
//   const accent = categoryColor(meta.category);
//   const displayLabel = data.customLabel?.trim() || meta.label;

//   return (
//     <div className={`package-node arch-node ${selected ? "selected" : ""}`} style={{ "--accent": accent }}>
//       <Handle type="target" position={Position.Left} />
//       <div className="package-node-icon">
//         <Icon name={meta.icon} size={16} strokeWidth={2} />
//       </div>
//       <div className="package-node-text">
//         <div className="package-node-label">{displayLabel}</div>
//         <div className="package-node-sublabel">{meta.label}</div>
//       </div>
//       <Handle type="source" position={Position.Right} />
//     </div>
//   );
// }
