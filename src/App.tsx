import { useState, useEffect } from "react";
import { ProductLandingPage } from "./pages/ProductLandingPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ThankYouPage } from "./pages/ThankYouPage";
import { TrackingPage } from "./pages/TrackingPage";
import { initMetaPixel, trackPageView } from "./services/metaPixel";
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

    // 3. Track initial PageView
    trackPageView(window.location.pathname);

    const handlePopState = () => {
      const newPath = window.location.pathname;
      setCurrentPath(newPath);
      trackPageView(newPath);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    trackPageView(path);
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

  return (
    <ProductLandingPage
      onNavigateToCheckout={() => navigateTo("/checkout")}
      onNavigateToTracking={() => navigateTo("/rastreio")}
    />
  );
}

export default App;
