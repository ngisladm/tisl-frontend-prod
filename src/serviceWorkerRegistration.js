// Registra o service worker para funcionar como PWA
export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => {
          console.log("✅ Service Worker registrado:", reg.scope);
          reg.onupdatefound = () => {
            const worker = reg.installing;
            if (!worker) return;
            worker.onstatechange = () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("🔄 Nova versão disponível. Recarregue para atualizar.");
              }
            };
          };
        })
        .catch((err) => console.error("❌ Service Worker falhou:", err));
    });
  }
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.unregister())
      .catch((err) => console.error(err));
  }
}
