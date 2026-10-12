// Diagnostics for the unmodified WordCraft WASM web build.
// It does not send document contents or telemetry anywhere.
(() => {
  const errors = [];
  const record = (value) => {
    const message = String(value ?? "Unknown startup error").slice(0, 350);
    if (message && errors.length < 6) errors.push(message);
    console.warn("[Karin Word startup]", message);
  };
  window.addEventListener("error", (event) => {
    if (event.target && event.target !== window) {
      const url = event.target.src || event.target.href;
      if (url) record("Resource failed: " + url);
    } else {
      record(event.message || event.error?.message || "JavaScript error");
    }
  }, true);
  window.addEventListener("unhandledrejection", event => {
    record(event.reason?.message || event.reason || "Unhandled promise rejection");
  });
  setTimeout(async () => {
    const loading = document.getElementById("wordcraft_loading");
    if (!loading || !loading.isConnected) return; // started successfully
    loading.style.pointerEvents = "auto";
    loading.style.maxWidth = "min(90vw, 720px)";
    loading.style.padding = "1.5rem";
    loading.style.textAlign = "center";
    loading.style.boxSizing = "border-box";
    loading.style.gap = "12px";
    const title = document.createElement("strong");
    title.textContent = "WordCraft の起動が完了していません";
    loading.replaceChildren(title);
    const detail = document.createElement("div");
    detail.style.cssText = "white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.6;";
    detail.textContent = errors.length ? errors.join("\n") : "WASM の読み込み中、またはグラフィックス初期化中です。";
    loading.append(detail);
    const tryGL = document.createElement("a");
    tryGL.textContent = "WebGL2 モードで再試行";
    tryGL.href = new URL("?webgl", location.href).href;
    tryGL.style.cssText = "display:inline-block;padding:10px 18px;border-radius:8px;background:#275fa5;color:white;font:600 14px system-ui;text-decoration:none;";
    loading.append(tryGL);
    try {
      const wasm = document.querySelector('link[rel="preload"][as="fetch"][href*=".wasm"],link[href*=".wasm"]');
      if (wasm) {
        const response = await fetch(wasm.href, { method: "HEAD", cache: "no-store" });
        const status = document.createElement("small");
        status.textContent = "WASM: HTTP " + response.status + " / " + response.headers.get("content-type");
        loading.append(status);
      }
    } catch (error) {
      record("WASM HEAD probe failed: " + error);
    }
  }, 18000);
})();
