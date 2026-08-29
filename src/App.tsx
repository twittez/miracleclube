import { useState, useEffect } from "react";
import { ProductLandingPage } from "./pages/ProductLandingPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ThankYouPage } from "./pages/ThankYouPage";
import { TrackingPage } from "./pages/TrackingPage";
import { RefundPolicyPage } from "./pages/RefundPolicyPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { initMetaPixel, trackPageView } from "./services/metaPixel";
import { initLiveTracker, trackLiveEvent, sendHeartbeat } from "./services/liveTracker";
import { captureUTMParams } from "./utils/utm";

// Rotas que são exclusivas para mobile (bloqueadas no desktop)
const MOBILE_ONLY_PATHS = ["/", "/checkout", "/obrigado", "/rastreio", "/politica-de-reembolso", "/politica-de-devolucao", "/trocas-e-devolucoes"];

function isMobile(): boolean {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(ua) ||
    window.innerWidth <= 900;
}

function isDesktopBlockedRoute(path: string): boolean {
  return MOBILE_ONLY_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

function DesktopBlockPage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#0f0f0f",
      color: "#fff",
      fontFamily: "sans-serif",
      textAlign: "center",
      padding: "40px 20px",
    }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#E54E88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 24 }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Acesso Restrito</h1>
      <p style={{ fontSize: 16, color: "#aaa", maxWidth: 420, lineHeight: 1.6 }}>
        Esta página está disponível <strong style={{ color: "#fff" }}>apenas para dispositivos móveis</strong>.<br />
        Acesse pelo seu celular para continuar.
      </p>
    </div>
  );
}

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [orderId, setOrderId] = useState<string>("");
  const [trackingCode, setTrackingCode] = useState<string>("");

  useEffect(() => {
    // 1. Capture UTMs and Meta cookies (_fbp, _fbc)
    captureUTMParams();

    // 2. Initialize Meta Pixel Browser Script (Once)
    initMetaPixel();

    // 3. Initialize Miracle Control Center Live Telemetry Tracker & Heartbeat
    initLiveTracker();

    // 4. Track initial PageView
    trackPageView(window.location.pathname);

    const handlePopState = () => {
      const newPath = window.location.pathname;
      setCurrentPath(newPath);
      trackPageView(newPath);
      trackLiveEvent('page_view', { path: newPath });
      sendHeartbeat();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    trackPageView(path);
    trackLiveEvent('page_view', { path });
    sendHeartbeat();
    window.scrollTo(0, 0);
  };

  // Bloquear desktop nas rotas mobile-only
  if (!isMobile() && isDesktopBlockedRoute(currentPath)) {
    return <DesktopBlockPage />;
  }

  // Route matching logic
  if (currentPath === "/checkout") {
    return (
      <CheckoutPage
        onNavigateToThankYou={(newOrderId) => {
          setOrderId(newOrderId);
          navigateTo(`/obrigado/${newOrderId}`);
        }}
        onNavigateBack={() => navigateTo("/")}
      />
    );
  }

  if (currentPath.startsWith("/obrigado")) {
    const parts = currentPath.split("/");
    const idFromUrl = parts[2] || orderId || "ORD-2026-DEMO";
    return (
      <ThankYouPage
        orderId={idFromUrl}
        onNavigateToTracking={(code) => {
          setTrackingCode(code);
          navigateTo("/rastreio");
        }}
      />
    );
  }

  if (currentPath === "/rastreio") {
    return (
      <TrackingPage
        initialCode={trackingCode}
        onNavigateHome={() => navigateTo("/")}
      />
    );
  }

  if (currentPath === "/admin" || currentPath.startsWith("/admin/")) {
    return <AdminDashboardPage />;
  }

  if (
    currentPath === "/politica-de-reembolso" ||
    currentPath === "/politica-de-devolucao" ||
    currentPath === "/trocas-e-devolucoes"
  ) {
    return (
      <RefundPolicyPage
        onNavigateHome={() => navigateTo("/")}
      />
    );
  }

  return (
    <ProductLandingPage
      onNavigateToCheckout={() => navigateTo("/checkout")}
      onNavigateToTracking={() => navigateTo("/rastreio")}
    />
  );
}

export default App;


