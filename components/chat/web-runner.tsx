import React, { useEffect, useState, useMemo } from "react";

interface WebRunnerProps {
  code: string;
}

export function WebRunner({ code }: WebRunnerProps) {
  const [srcDoc, setSrcDoc] = useState("");

  useEffect(() => {
    // Deteksi dasar tipe kode
    const isReact = code.includes("import React") || code.includes("export default function");
    const hasTailwind = code.includes("className=");

    let finalHtml = code;

    if (isReact) {
      // Membersihkan sintaks ES module yang tidak didukung langsung oleh browser tanpa bundler
      const cleanedCode = code
        .replace(/import\s+.*?from\s+['"].*?['"];?/g, "") // Hapus imports
        .replace(/export\s+default\s+function\s+(\w+)/g, "function $1") // Ubah export default function
        .replace(/export\s+default\s+(\w+);?/g, ""); // Hapus export default variabel

      const componentMatch = cleanedCode.match(/function\s+(\w+)/);
      const mainComponent = componentMatch ? componentMatch[1] : "App";

      finalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${hasTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ""}
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <style>
            body { margin: 0; padding: 0; width: 100vw; min-height: 100vh; font-family: sans-serif; overflow: auto; }
            #root { width: 100%; min-height: 100vh; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            const { useState, useEffect, useRef, useMemo, useCallback } = React;
            
            ${cleanedCode}

            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<${mainComponent} />);
          </script>
        </body>
        </html>
      `;
    } else {
      // Jika kode adalah HTML/JS murni (Vanilla atau p5.js)
      if (!code.includes("<html") && !code.includes("<body")) {
        finalHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            ${hasTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ""}
            <style>
              body { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; display: flex; justify-content: center; align-items: center; }
              canvas { display: block; }
            </style>
          </head>
          <body>
            <div id="app"></div>
            <script>
              ${code}
            </script>
          </body>
          </html>
        `;
      }
    }

    setSrcDoc(finalHtml);
  }, [code]);

  return (
    <div className="w-full h-full min-h-[500px] bg-white relative">
      <iframe
        srcDoc={srcDoc}
        title="Web Sandbox"
        className="w-full h-full min-h-[500px] border-0"
        sandbox="allow-scripts allow-modals allow-forms allow-popups"
      />
    </div>
  );
}
