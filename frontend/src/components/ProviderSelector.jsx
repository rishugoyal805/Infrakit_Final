import { PROVIDERS } from "../providerSkins.js";

export default function ProviderSelector({ provider, onChange }) {
  return (
    <div role="tablist" aria-label="Cloud provider skin" className="flex gap-0.5 rounded-[9px] bg-[#f2f2f4] p-[3px]">
      {PROVIDERS.map((p) => {
        const active = provider === p.id;
        return (
          <button
            key={p.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p.id)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors hover:cursor-pointer ${
              active ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: p.color }} />
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

// import { PROVIDERS } from "../providerSkins.js";

// export default function ProviderSelector({ provider, onChange }) {
//   return (
//     <div className="provider-selector" role="tablist" aria-label="Cloud provider skin">
//       {PROVIDERS.map((p) => (
//         <button
//           key={p.id}
//           role="tab"
//           aria-selected={provider === p.id}
//           className={`provider-tab ${provider === p.id ? "active" : ""}`}
//           style={provider === p.id ? { "--accent": p.color } : undefined}
//           onClick={() => onChange(p.id)}
//         >
//           <span className="provider-dot" style={{ background: p.color }} />
//           {p.label}
//         </button>
//       ))}
//     </div>
//   );
// }
