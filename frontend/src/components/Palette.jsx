import Icon from "./Icon.jsx";
import { skinFor, providerColor } from "../providerSkins.js";

export default function Palette({ catalog, placedTypes, provider = "generic" }) {
  const accent = providerColor(provider);

  function onDragStart(e, type) {
    e.dataTransfer.setData("application/infrakit-node-type", type);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside className="palette">
      <h3>Packages</h3>
      {Object.entries(catalog).map(([type, pkg]) => {
        const alreadyPlaced = placedTypes.has(type);
        const skin = skinFor(type, provider);
        return (
          <div
            key={type}
            className={`palette-item ${alreadyPlaced ? "disabled" : ""}`}
            draggable={!alreadyPlaced}
            onDragStart={(e) => !alreadyPlaced && onDragStart(e, type)}
            title={alreadyPlaced ? "Already on canvas — one node per package in v1" : pkg.description}
            style={{ "--accent": accent }}
          >
            <span className="palette-item-icon">
              <Icon name={skin.icon} size={15} strokeWidth={2} />
            </span>
            <span className="palette-item-text">
              <span className="palette-item-label">{skin.label}</span>
              <span className="palette-item-sublabel">{type}</span>
            </span>
          </div>
        );
      })}
    </aside>
  );
}


// import Icon from "./Icon.jsx";
// import { skinFor, providerColor } from "../providerSkins.js";

// export default function Palette({ catalog, placedTypes, provider = "generic" }) {
//   const accent = providerColor(provider);

//   function onDragStart(e, type) {
//     e.dataTransfer.setData("application/infrakit-node-type", type);
//     e.dataTransfer.effectAllowed = "move";
//   }

//   return (
//     <aside className="palette">
//       <h3>Packages</h3>
//       {Object.entries(catalog).map(([type, pkg]) => {
//         const alreadyPlaced = placedTypes.has(type);
//         const skin = skinFor(type, provider);
//         return (
//           <div
//             key={type}
//             className={`palette-item ${alreadyPlaced ? "disabled" : ""}`}
//             draggable={!alreadyPlaced}
//             onDragStart={(e) => !alreadyPlaced && onDragStart(e, type)}
//             title={alreadyPlaced ? "Already on canvas — one node per package in v1" : pkg.description}
//             style={{ "--accent": accent }}
//           >
//             <span className="palette-item-icon">
//               <Icon name={skin.icon} size={15} strokeWidth={2} />
//             </span>
//             <span className="palette-item-text">
//               <span className="palette-item-label">{skin.label}</span>
//               <span className="palette-item-sublabel">{type}</span>
//             </span>
//           </div>
//         );
//       })}
//     </aside>
//   );
// }
