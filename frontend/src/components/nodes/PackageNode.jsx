import { Handle, Position } from "@xyflow/react";
import Icon from "../Icon.jsx";
import { skinFor, providerColor } from "../../providerSkins.js";
import { INFRAKIT_DISPLAY } from "../../architectureCatalog.js";

export default function PackageNode({ data, selected }) {
  const provider = data.provider || "generic";
  const skin = skinFor(data.pkgType, provider);
  const accent = providerColor(provider);
  const icon = INFRAKIT_DISPLAY[data.pkgType]?.icon || "Box";
  const displayLabel = data.nickname?.trim() || skin.label;

  return (
    <div
      style={{
        borderLeftColor: accent,
        outline: selected ? `2px solid ${accent}` : "none",
        outlineOffset: selected ? "2px" : "0",
      }}
      className="flex items-center gap-2.5 rounded-[10px] border border-border border-l-[3px] bg-white py-2.5 pl-2.5 pr-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <Handle type="target" position={Position.Left} />
      <div
        style={{ background: `${accent}24`, color: accent }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]"
      >
        <Icon name={icon} size={16} strokeWidth={2} />
      </div>
      <div className="flex flex-col">
        <div className="text-[12.5px] font-semibold leading-tight text-ink">{displayLabel}</div>
        <div className="font-mono text-[10px] text-ink-soft">{skin.label}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}


// import { Handle, Position } from "@xyflow/react";
// import Icon from "../Icon.jsx";
// import { skinFor, providerColor } from "../../providerSkins.js";
// import { INFRAKIT_DISPLAY } from "../../architectureCatalog.js";

// export default function PackageNode({ data, selected, provider = "generic" }) {
//   const skin = skinFor(data.pkgType, provider);
//   const accent = providerColor(provider);
//   const icon = INFRAKIT_DISPLAY[data.pkgType]?.icon || "Box";
//   const displayLabel = data.nickname?.trim() || skin.label;

//   return (
//     <div className={`package-node ${selected ? "selected" : ""}`} style={{ "--accent": accent }}>
//       <Handle type="target" position={Position.Left} />
//       <div className="package-node-icon">
//         <Icon name={icon} size={16} strokeWidth={2} />
//       </div>
//       <div className="package-node-text">
//         <div className="package-node-label">{displayLabel}</div>
//         <div className="package-node-sublabel">{skin.label}</div>
//       </div>
//       <Handle type="source" position={Position.Right} />
//     </div>
//   );
// }
