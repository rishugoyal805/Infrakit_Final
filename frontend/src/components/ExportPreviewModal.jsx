// import { useMemo, useState } from "react";
// import ReactMarkdown from "react-markdown";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import {
//   oneLight,
//   vscDarkPlus,
// } from "react-syntax-highlighter/dist/esm/styles/prism";
// import Icon from "./Icon.jsx";

// function iconFor(filename) {
//   if (filename.endsWith(".md")) return "FileText";
//   if (filename.endsWith(".js")) return "FileCode";
//   if (filename.startsWith(".env")) return "KeyRound";
//   return "File";
// }

// function languageFor(filename) {
//   if (filename.endsWith(".js")) return "javascript";
//   if (filename.startsWith(".env")) return "bash";
//   return "text";
// }

// export default function ExportPreviewModal({
//   files,
//   onClose,
//   onDownload,
//   downloading,
// }) {
//   const sortedFiles = useMemo(() => {
//     const idx = files.findIndex((f) => f.name.endsWith(".md"));

//     if (idx <= 0) return files;

//     const copy = [...files];
//     const [md] = copy.splice(idx, 1);
//     copy.unshift(md);

//     return copy;
//   }, [files]);

//   const [activeIdx, setActiveIdx] = useState(0);
//   const [copied, setCopied] = useState(false);

//   const active = sortedFiles[activeIdx];

//   if (!active) return null;

//   const isMarkdown = active.name.endsWith(".md");
//   const lineCount = active.content.split("\n").length;

//   function copy() {
//     navigator.clipboard.writeText(active.content);
//     setCopied(true);

//     setTimeout(() => {
//       setCopied(false);
//     }, 1200);
//   }

//   return (
//     <div
//       className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4"
//       onClick={onClose}
//     >
//       <div
//         className="flex h-[90vh] max-h-225 w-full max-w-375 min-w-0 flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* HEADER */}
//         <div className="flex shrink-0 items-center justify-between border-b border-[#dedee2] px-5 py-3.5">
//           <h3 className="m-0 text-[16px] font-semibold text-[#29292d]">
//             Export Preview
//           </h3>

//           <button
//             onClick={onClose}
//             aria-label="Close export preview"
//             title="Close"
//             className="flex h-7 w-7 items-center justify-center rounded-md text-[18px] leading-none text-[#55555c] transition-colors hover:bg-[#f1f1f3] hover:text-[#222226]"
//           >
//             ×
//           </button>
//         </div>

//         {/* MAIN AREA */}
//         <div className="flex min-h-0 flex-1">
//           {/* SIDEBAR */}
//           <aside className="flex w-65 shrink-0 flex-col border-r border-[#dedee2] bg-[#fafafa]">
//             <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
//               <div className="space-y-0.5">
//                 {sortedFiles.map((file, index) => {
//                   const selected = index === activeIdx;

//                   return (
//                     <button
//                       key={file.name}
//                       onClick={() => {
//                         setActiveIdx(index);
//                         setCopied(false);
//                       }}
//                       title={file.name}
//                       className={`group flex w-full items-start gap-2.5 rounded-[7px] px-2.5 py-2 text-left transition-colors duration-150 ${
//                         selected
//                           ? "bg-[#4f46e5] text-white"
//                           : "text-[#34343a] hover:bg-[#eeeeF2]"
//                       }`}
//                     >
//                       {/* FILE ICON */}
//                       <span
//                         className={`mt-[2px] shrink-0 ${
//                           selected ? "text-white" : "text-[#55555c]"
//                         }`}
//                       >
//                         <Icon
//                           name={iconFor(file.name)}
//                           size={15}
//                           strokeWidth={2}
//                         />
//                       </span>

//                       {/* FILENAME */}
//                       <span
//                         className={`min-w-0 flex-1 break-words text-[12.5px] leading-[1.4] ${
//                           selected ? "text-white" : "text-[#34343a]"
//                         }`}
//                       >
//                         {file.name}
//                       </span>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           </aside>

//           {/* CONTENT */}
//           <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
//             {/* FILE TOOLBAR */}
//             <div className="flex min-h-[54px] shrink-0 items-center justify-between gap-4 border-b border-[#dedee2] bg-white px-4">
//               {/* ACTIVE FILE NAME */}
//               <div
//                 className="flex min-w-0 flex-1 items-center gap-2"
//                 title={active.name}
//               >
//                 <span className="shrink-0 text-[#55555c]">
//                   <Icon name={iconFor(active.name)} size={15} strokeWidth={2} />
//                 </span>

//                 <span className="min-w-0 break-words text-[13px] font-semibold leading-5 text-[#34343a]">
//                   {active.name}
//                 </span>
//               </div>

//               {/* FILE INFO + COPY */}
//               <div className="flex shrink-0 items-center gap-3">
//                 {!isMarkdown && (
//                   <span className="hidden text-[11.5px] text-[#96969d] sm:block">
//                     {lineCount} lines
//                   </span>
//                 )}

//                 <button
//                   onClick={copy}
//                   className="rounded-[7px] border border-[#bdbdc3] bg-white px-3 py-1.5 text-[12px] font-medium text-[#34343a] transition-colors duration-150 hover:bg-[#f3f3f5] hover:border-[#8f8f96]"
//                 >
//                   {copied ? "Copied" : "Copy"}
//                 </button>
//               </div>
//             </div>

//             {/* PREVIEW */}
//             {isMarkdown ? (
//               <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f6f9]">
//                 <div className="mx-auto w-full max-w-[1050px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
//                   <article className="readme-preview overflow-hidden rounded-[12px] border border-[#e1e5eb] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
//                     <div className="px-6 py-7 sm:px-9 sm:py-9 lg:px-11 lg:py-10">
//                       <ReactMarkdown
//                         components={{
//                           a: ({ node, ...props }) => (
//                             <a
//                               {...props}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="font-medium text-[#4f46e5] underline decoration-[#c7c5ff] underline-offset-[3px] transition-colors hover:text-[#3730a3] hover:decoration-[#4f46e5]"
//                             />
//                           ),

//                           img: ({ node, ...props }) => (
//                             <img
//                               {...props}
//                               loading="lazy"
//                               alt={props.alt || ""}
//                               className="my-5 max-h-[520px] w-auto max-w-full rounded-lg border border-[#e2e4e8] object-contain shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
//                             />
//                           ),

//                           h1: ({ node, ...props }) => (
//                             <h1
//                               {...props}
//                               className="mb-5 mt-0 border-b border-[#e5e9f0] pb-3 text-[28px] font-bold tracking-[-0.02em] text-[#172033] sm:text-[32px]"
//                             />
//                           ),

//                           h2: ({ node, ...props }) => (
//                             <h2
//                               {...props}
//                               className="mb-4 mt-9 border-b border-[#edf0f4] pb-2.5 text-[22px] font-bold tracking-[-0.015em] text-[#202938]"
//                             />
//                           ),

//                           h3: ({ node, ...props }) => (
//                             <h3
//                               {...props}
//                               className="mb-3 mt-7 text-[18px] font-semibold text-[#273244]"
//                             />
//                           ),

//                           h4: ({ node, ...props }) => (
//                             <h4
//                               {...props}
//                               className="mb-2.5 mt-6 text-[16px] font-semibold text-[#303a4b]"
//                             />
//                           ),

//                           p: ({ node, ...props }) => (
//                             <p
//                               {...props}
//                               className="mb-4 text-[14px] leading-[1.75] text-[#4b5565]"
//                             />
//                           ),

//                           strong: ({ node, ...props }) => (
//                             <strong
//                               {...props}
//                               className="font-semibold text-[#273244]"
//                             />
//                           ),

//                           em: ({ node, ...props }) => (
//                             <em {...props} className="text-[#4b5565]" />
//                           ),

//                           ul: ({ node, ...props }) => (
//                             <ul
//                               {...props}
//                               className="mb-5 ml-5 list-disc space-y-1.5 pl-4 text-[14px] leading-[1.7] text-[#4b5565]"
//                             />
//                           ),

//                           ol: ({ node, ...props }) => (
//                             <ol
//                               {...props}
//                               className="mb-5 ml-5 list-decimal space-y-1.5 pl-4 text-[14px] leading-[1.7] text-[#4b5565]"
//                             />
//                           ),

//                           li: ({ node, ...props }) => (
//                             <li {...props} className="pl-1.5" />
//                           ),

//                           blockquote: ({ node, ...props }) => (
//                             <blockquote
//                               {...props}
//                               className="my-5 border-l-[3px] border-[#818cf8] bg-[#f7f8ff] px-4 py-3 text-[14px] italic leading-[1.7] text-[#596273]"
//                             />
//                           ),

//                           hr: ({ node, ...props }) => (
//                             <hr
//                               {...props}
//                               className="my-8 border-0 border-t border-[#e5e9f0]"
//                             />
//                           ),

//                           code: ({ inline, className, children, ...props }) => {
//                             if (inline) {
//                               return (
//                                 <code
//                                   {...props}
//                                   className="rounded-[5px] border border-[#dfe4ee] bg-[#f3f6fb] px-1.25 py-[2px] font-mono text-[12px] font-medium text-[#475569]"
//                                 >
//                                   {children}
//                                 </code>
//                               );
//                             }

//                             const match = /language-(\w+)/.exec(
//                               className || "",
//                             );

//                             return (
//                               <SyntaxHighlighter
//                                 language={match?.[1] || "text"}
//                                 style={oneLight}
//                                 PreTag="div"
//                                 customStyle={{
//                                   margin: "18px 0 22px",
//                                   padding: "16px 18px",
//                                   background: "#f5f7fb",
//                                   border: "1px solid #dfe4ee",
//                                   borderRadius: "8px",
//                                   fontSize: "12.5px",
//                                   lineHeight: 1.7,
//                                   overflowX: "auto",
//                                   boxShadow: "0 1px 3px rgba(30, 41, 59, 0.06)",
//                                 }}
//                                 codeTagProps={{
//                                   style: {
//                                     fontFamily:
//                                       "'SF Mono', 'Fira Code', Menlo, Consolas, monospace",
//                                     color: "#334155",
//                                   },
//                                 }}
//                               >
//                                 {String(children).replace(/\n$/, "")}
//                               </SyntaxHighlighter>
//                             );
//                           },

//                           table: ({ node, ...props }) => (
//                             <div className="my-6 w-full overflow-x-auto rounded-lg border border-[#e1e5eb]">
//                               <table
//                                 {...props}
//                                 className="w-full min-w-130 border-collapse text-left text-[13px]"
//                               />
//                             </div>
//                           ),

//                           thead: ({ node, ...props }) => (
//                             <thead
//                               {...props}
//                               className="bg-[#f5f7fa] text-[12px] font-semibold uppercase tracking-[0.04em] text-[#3f4a5a]"
//                             />
//                           ),

//                           tbody: ({ node, ...props }) => (
//                             <tbody
//                               {...props}
//                               className="divide-y divide-[#e8ebf0]"
//                             />
//                           ),

//                           th: ({ node, ...props }) => (
//                             <th
//                               {...props}
//                               className="px-4 py-3 font-semibold text-[#374151]"
//                             />
//                           ),

//                           td: ({ node, ...props }) => (
//                             <td
//                               {...props}
//                               className="px-4 py-3 align-top text-[#596273]"
//                             />
//                           ),

//                           br: ({ node, ...props }) => <br {...props} />,
//                         }}
//                       >
//                         {active.content}
//                       </ReactMarkdown>
//                     </div>
//                   </article>
//                 </div>
//               </div>
//             ) : (
//               <SyntaxHighlighter
//                 language={languageFor(active.name)}
//                 style={vscDarkPlus}
//                 showLineNumbers
//                 customStyle={{
//                   margin: 0,
//                   flex: 1,
//                   fontSize: "12.5px",
//                   lineHeight: 1.6,
//                   padding: "18px 20px",
//                   background: "#1e1e1e",
//                   overflow: "auto",
//                 }}
//                 codeTagProps={{
//                   style: {
//                     fontFamily:
//                       "'SF Mono', 'Fira Code', Menlo, Consolas, monospace",
//                   },
//                 }}
//               >
//                 {active.content}
//               </SyntaxHighlighter>
//             )}
//           </main>
//         </div>

//         {/* FOOTER */}
//         <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[#dedee2] bg-white px-5 py-3.5">
//           <p className="m-0 text-[12.5px] text-[#77777f]">
//             {sortedFiles.length} file
//             {sortedFiles.length === 1 ? "" : "s"} will be included in the ZIP.
//           </p>

//           <button
//             onClick={onDownload}
//             disabled={downloading}
//             className="shrink-0 rounded-[8px] bg-[#333338] px-5 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#222226] disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {downloading ? "Preparing…" : "Download ZIP"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Icon from "./Icon.jsx";

function iconFor(filename) {
  if (filename.endsWith(".md")) return "FileText";
  if (filename.endsWith(".js")) return "FileCode";
  if (filename.startsWith(".env")) return "KeyRound";
  return "File";
}

function languageFor(filename) {
  if (filename.endsWith(".js")) return "javascript";
  if (filename.startsWith(".env")) return "bash";
  return "text";
}

function getLanguage(className = "") {
  const match = /language-([\w-]+)/.exec(className);
  return match?.[1] || "text";
}

export default function ExportPreviewModal({
  files,
  onClose,
  onDownload,
  downloading,
}) {
  const sortedFiles = useMemo(() => {
    const idx = files.findIndex((f) => f.name.endsWith(".md"));

    if (idx <= 0) return files;

    const copy = [...files];
    const [md] = copy.splice(idx, 1);
    copy.unshift(md);

    return copy;
  }, [files]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copiedBlock, setCopiedBlock] = useState(null);

  const active = sortedFiles[activeIdx];

  const blockCounter = useRef(0);

  if (!active) return null;

  const isMarkdown = active.name.endsWith(".md");
  const lineCount = active.content.split("\n").length;

  function copy() {
    navigator.clipboard.writeText(active.content);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1200);
  }

  function copyBlock(code, id) {
    navigator.clipboard.writeText(code);
    setCopiedBlock(id);

    setTimeout(() => {
      setCopiedBlock((current) => (current === id ? null : current));
    }, 1200);
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] max-h-225 w-full max-w-[1500px] min-w-0 flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#d8dee4] px-5 py-3.5">
          <h3 className="m-0 text-[16px] font-semibold text-[#24292f]">
            Export Preview
          </h3>

          <button
            onClick={onClose}
            aria-label="Close export preview"
            title="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[18px] leading-none text-[#57606a] transition-colors hover:bg-[#f6f8fa] hover:text-[#24292f]"
          >
            ×
          </button>
        </div>

        {/* MAIN AREA */}
        <div className="flex min-h-0 flex-1">
          {/* SIDEBAR */}
          <aside className="flex w-[260px] shrink-0 flex-col border-r border-[#d8dee4] bg-[#f6f8fa]">
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
              <div className="space-y-0.5">
                {sortedFiles.map((file, index) => {
                  const selected = index === activeIdx;

                  return (
                    <button
                      key={file.name}
                      onClick={() => {
                        setActiveIdx(index);
                        setCopied(false);
                        setCopiedBlock(null);
                      }}
                      title={file.name}
                      className={`group flex w-full items-start gap-2.5 rounded-[7px] px-2.5 py-2 text-left transition-colors duration-150 ${
                        selected
                          ? "bg-[#0969da] text-white"
                          : "text-[#24292f] hover:bg-[#eaeef2]"
                      }`}
                    >
                      <span
                        className={`mt-[2px] shrink-0 ${
                          selected ? "text-white" : "text-[#57606a]"
                        }`}
                      >
                        <Icon
                          name={iconFor(file.name)}
                          size={15}
                          strokeWidth={2}
                        />
                      </span>

                      <span
                        className={`min-w-0 flex-1 break-words text-[12.5px] leading-[1.4] ${
                          selected ? "text-white" : "text-[#24292f]"
                        }`}
                      >
                        {file.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* FILE TOOLBAR */}
            <div className="flex min-h-[54px] shrink-0 items-center justify-between gap-4 border-b border-[#d8dee4] bg-white px-4">
              <div
                className="flex min-w-0 flex-1 items-center gap-2"
                title={active.name}
              >
                <span className="shrink-0 text-[#57606a]">
                  <Icon name={iconFor(active.name)} size={15} strokeWidth={2} />
                </span>

                <span className="min-w-0 break-words text-[13px] font-semibold leading-5 text-[#24292f]">
                  {active.name}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {!isMarkdown && (
                  <span className="hidden text-[11.5px] text-[#8c959f] sm:block">
                    {lineCount} lines
                  </span>
                )}

                <button
                  onClick={copy}
                  className="rounded-[7px] border border-[#d0d7de] bg-white px-3 py-1.5 text-[12px] font-medium text-[#24292f] transition-colors duration-150 hover:border-[#afb8c1] hover:bg-[#f6f8fa]"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* PREVIEW */}
            {isMarkdown ? (
              <div className="min-h-0 flex-1 overflow-y-auto bg-[#f6f8fa]">
                <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
                  <article className="overflow-hidden rounded-xl border border-[#d8dee4] bg-white shadow-[0_1px_3px_rgba(31,35,40,0.08)]">
                    <div className="px-6 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
                      {(() => {
                        blockCounter.current = 0;

                        return (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ node, children, ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-[#0969da] no-underline hover:underline"
                                >
                                  {children}
                                </a>
                              ),

                              img: ({ node, alt, ...props }) => (
                                <span className="my-6 block">
                                  <img
                                    {...props}
                                    loading="lazy"
                                    alt={alt || ""}
                                    className="mx-auto max-h-[650px] max-w-full rounded-lg border border-[#d8dee4] object-contain"
                                  />

                                  {alt && (
                                    <span className="mt-2 block text-center text-xs text-[#656d76]">
                                      {alt}
                                    </span>
                                  )}
                                </span>
                              ),

                              h1: ({ node, children, ...props }) => (
                                <h1
                                  {...props}
                                  className="mb-6 mt-0 border-b border-[#d8dee4] pb-4 text-[30px] font-semibold tracking-[-0.02em] text-[#1f2328] sm:text-[34px]"
                                >
                                  {children}
                                </h1>
                              ),

                              h2: ({ node, children, ...props }) => (
                                <h2
                                  {...props}
                                  className="mb-4 mt-10 border-b border-[#d8dee4] pb-2.5 text-[23px] font-semibold tracking-[-0.015em] text-[#1f2328]"
                                >
                                  {children}
                                </h2>
                              ),

                              h3: ({ node, children, ...props }) => (
                                <h3
                                  {...props}
                                  className="mb-3 mt-8 text-[19px] font-semibold tracking-[-0.01em] text-[#1f2328]"
                                >
                                  {children}
                                </h3>
                              ),

                              h4: ({ node, children, ...props }) => (
                                <h4
                                  {...props}
                                  className="mb-2 mt-6 text-[16px] font-semibold text-[#1f2328]"
                                >
                                  {children}
                                </h4>
                              ),

                              h5: ({ node, children, ...props }) => (
                                <h5
                                  {...props}
                                  className="mb-2 mt-5 text-[14px] font-semibold text-[#1f2328]"
                                >
                                  {children}
                                </h5>
                              ),

                              h6: ({ node, children, ...props }) => (
                                <h6
                                  {...props}
                                  className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-wide text-[#656d76]"
                                >
                                  {children}
                                </h6>
                              ),

                              p: ({ node, children, ...props }) => (
                                <p
                                  {...props}
                                  className="mb-4 text-[14px] leading-[1.7] text-[#3d444d] sm:text-[15px]"
                                >
                                  {children}
                                </p>
                              ),

                              strong: ({ node, children, ...props }) => (
                                <strong
                                  {...props}
                                  className="font-semibold text-[#1f2328]"
                                >
                                  {children}
                                </strong>
                              ),

                              em: ({ node, children, ...props }) => (
                                <em {...props} className="text-[#3d444d]">
                                  {children}
                                </em>
                              ),

                              del: ({ node, children, ...props }) => (
                                <del {...props} className="text-[#656d76]">
                                  {children}
                                </del>
                              ),

                              ul: ({ node, children, ...props }) => (
                                <ul
                                  {...props}
                                  className="mb-5 ml-6 list-disc space-y-1.5 pl-2 text-[14px] leading-[1.7] text-[#3d444d] sm:text-[15px]"
                                >
                                  {children}
                                </ul>
                              ),

                              ol: ({ node, children, ...props }) => (
                                <ol
                                  {...props}
                                  className="mb-5 ml-6 list-decimal space-y-1.5 pl-2 text-[14px] leading-[1.7] text-[#3d444d] sm:text-[15px]"
                                >
                                  {children}
                                </ol>
                              ),

                              li: ({ node, children, ...props }) => (
                                <li {...props} className="pl-1">
                                  {children}
                                </li>
                              ),

                              blockquote: ({ node, children, ...props }) => (
                                <blockquote
                                  {...props}
                                  className="my-5 border-l-4 border-[#afb8c1] bg-[#f6f8fa] px-4 py-2.5 text-[14px] leading-[1.7] text-[#656d76]"
                                >
                                  {children}
                                </blockquote>
                              ),

                              hr: ({ node, ...props }) => (
                                <hr
                                  {...props}
                                  className="my-8 border-0 border-t border-[#d8dee4]"
                                />
                              ),

                              code: ({
                                node,
                                inline,
                                className,
                                children,
                                ...props
                              }) => {
                                if (inline) {
                                  return (
                                    <code
                                      {...props}
                                      className="rounded-md border border-[#d8dee4] bg-[#f6f8fa] px-1.5 py-[2px] font-mono text-[12px] font-medium text-[#24292f]"
                                    >
                                      {children}
                                    </code>
                                  );
                                }

                                return (
                                  <code
                                    {...props}
                                    className={className}
                                  >
                                    {children}
                                  </code>
                                );
                              },

                              pre: ({ node, children }) => {
                                const child = children?.props;

                                if (!child) return null;

                                const code = String(child.children ?? "").replace(
                                  /\n$/,
                                  "",
                                );

                                const language = getLanguage(
                                  child.className,
                                );

                                const blockId = blockCounter.current++;

                                return (
                                  <div className="my-6 overflow-hidden rounded-lg border border-[#30363d] bg-[#0d1117]">
                                    <div className="flex items-center justify-between border-b border-[#30363d] bg-[#161b22] px-3.5 py-2">
                                      <span className="font-mono text-[11px] font-medium text-[#8b949e]">
                                        {language}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          copyBlock(code, blockId)
                                        }
                                        className="rounded-md px-2 py-1 text-[11px] font-medium text-[#8b949e] transition-colors hover:bg-[#30363d] hover:text-[#f0f6fc]"
                                      >
                                        {copiedBlock === blockId
                                          ? "Copied"
                                          : "Copy"}
                                      </button>
                                    </div>

                                    <SyntaxHighlighter
                                      language={language}
                                      style={vscDarkPlus}
                                      PreTag="div"
                                      customStyle={{
                                        margin: 0,
                                        padding: "16px 18px",
                                        background: "#0d1117",
                                        fontSize: "12.5px",
                                        lineHeight: 1.65,
                                        overflowX: "auto",
                                      }}
                                      codeTagProps={{
                                        style: {
                                          fontFamily:
                                            "'SF Mono', 'Fira Code', Menlo, Consolas, monospace",
                                        },
                                      }}
                                    >
                                      {code}
                                    </SyntaxHighlighter>
                                  </div>
                                );
                              },

                              table: ({ node, children, ...props }) => (
                                <div className="my-6 w-full overflow-x-auto rounded-lg border border-[#d8dee4]">
                                  <table
                                    {...props}
                                    className="w-full min-w-[520px] border-collapse text-left text-[13px]"
                                  >
                                    {children}
                                  </table>
                                </div>
                              ),

                              thead: ({ node, children, ...props }) => (
                                <thead
                                  {...props}
                                  className="bg-[#f6f8fa] text-[12px] font-semibold text-[#1f2328]"
                                >
                                  {children}
                                </thead>
                              ),

                              tbody: ({ node, children, ...props }) => (
                                <tbody
                                  {...props}
                                  className="divide-y divide-[#d8dee4]"
                                >
                                  {children}
                                </tbody>
                              ),

                              tr: ({ node, children, ...props }) => (
                                <tr
                                  {...props}
                                  className="transition-colors hover:bg-[#f6f8fa]"
                                >
                                  {children}
                                </tr>
                              ),

                              th: ({ node, children, ...props }) => (
                                <th
                                  {...props}
                                  className="border-b border-[#d8dee4] px-4 py-3 text-left font-semibold text-[#1f2328]"
                                >
                                  {children}
                                </th>
                              ),

                              td: ({ node, children, ...props }) => (
                                <td
                                  {...props}
                                  className="px-4 py-3 align-top text-[#3d444d]"
                                >
                                  {children}
                                </td>
                              ),

                              input: ({ node, type, checked, ...props }) => {
                                if (type === "checkbox") {
                                  return (
                                    <input
                                      {...props}
                                      type="checkbox"
                                      checked={checked}
                                      readOnly
                                      className="mr-2 h-4 w-4 translate-y-[2px] accent-[#0969da]"
                                    />
                                  );
                                }

                                return <input {...props} type={type} />;
                              },

                              details: ({ node, children, ...props }) => (
                                <details
                                  {...props}
                                  className="my-5 rounded-lg border border-[#d8dee4] bg-[#f6f8fa] px-4 py-3"
                                >
                                  {children}
                                </details>
                              ),

                              summary: ({ node, children, ...props }) => (
                                <summary
                                  {...props}
                                  className="cursor-pointer select-none text-[14px] font-semibold text-[#1f2328]"
                                >
                                  {children}
                                </summary>
                              ),

                              br: ({ node, ...props }) => <br {...props} />,
                            }}
                          >
                            {active.content}
                          </ReactMarkdown>
                        );
                      })()}
                    </div>
                  </article>
                </div>
              </div>
            ) : (
              <SyntaxHighlighter
                language={languageFor(active.name)}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  flex: 1,
                  fontSize: "12.5px",
                  lineHeight: 1.6,
                  padding: "18px 20px",
                  background: "#0d1117",
                  overflow: "auto",
                }}
                codeTagProps={{
                  style: {
                    fontFamily:
                      "'SF Mono', 'Fira Code', Menlo, Consolas, monospace",
                  },
                }}
              >
                {active.content}
              </SyntaxHighlighter>
            )}
          </main>
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[#d8dee4] bg-white px-5 py-3.5">
          <p className="m-0 text-[12.5px] text-[#656d76]">
            {sortedFiles.length} file
            {sortedFiles.length === 1 ? "" : "s"} will be included in the ZIP.
          </p>

          <button
            onClick={onDownload}
            disabled={downloading}
            className="shrink-0 rounded-[8px] bg-[#24292f] px-5 py-2.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#1f2328] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? "Preparing…" : "Download ZIP"}
          </button>
        </div>
      </div>
    </div>
  );
}