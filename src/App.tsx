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
