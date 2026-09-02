declare global {
  interface Window {
    ttq: any;
    TiktokAnalyticsObject: any;
  }
}

export const TIKTOK_PIXEL_ID = "DAB50ARC77UEOA3OAHCG";

let isInitialized = false;

/**
 * Initialize TikTok Pixel Base Script (Only once)
 */
export function initTikTokPixel(): void {
  if (typeof window === "undefined" || isInitialized) return;

  if (window.ttq && window.ttq.loaded) {
    isInitialized = true;
    return;
  }

  /* eslint-disable */
  (function (w: any, d: any, t: string) {
    w.TiktokAnalyticsObject = t;
    var ttq = (w[t] = w[t] || []);
    ttq.methods = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "once",
      "ready",
      "alias",
      "group",
      "enableCookie",
      "disableCookie",
      "holdConsent",
      "revokeConsent",
      "grantConsent"
    ];
    ttq.setAndDefer = function (t: any, e: any) {
      t[e] = function () {
        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (var i = 0; i < ttq.methods.length; i++) {
      ttq.setAndDefer(ttq, ttq.methods[i]);
    }
    ttq.instance = function (t: any) {
      var e = ttq._i[t] || [];
      for (var n = 0; n < ttq.methods.length; n++) {
        ttq.setAndDefer(e, ttq.methods[n]);
      }
      return e;
    };
    ttq.load = function (e: any, n: any) {
      var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = r;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      var a = d.createElement("script");
      a.type = "text/javascript";
      a.async = true;
      a.src = r + "?sdkid=" + e + "&lib=" + t;
      var c = d.getElementsByTagName("script")[0];
      c.parentNode.insertBefore(a, c);
    };

    ttq.load(TIKTOK_PIXEL_ID);
    ttq.page();
  })(window, document, "ttq");
  /* eslint-enable */

  isInitialized = true;
  console.log(`[TikTok Pixel] Initialized successfully with ID: ${TIKTOK_PIXEL_ID}`);
}

/**
 * Generate Event ID for deduplication
 */
export function generateTikTokEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * PageView Tracking (With route change protection)
 */
let lastTrackedPath = "";
export function trackTikTokPageView(pathName?: string): void {
  if (typeof window === "undefined" || !window.ttq) return;

  const currentPath = pathName || window.location.pathname;
  if (currentPath === lastTrackedPath) return;

  lastTrackedPath = currentPath;
  window.ttq.page();
  console.log(`[TikTok Pixel] PageView tracked for path: ${currentPath}`);
}

/**
 * ViewContent Tracking (Product Page View)
 */
export function trackTikTokViewContent(product: {
  id: string;
  name: string;
  price: number;
}): void {
  if (typeof window === "undefined" || !window.ttq) return;

  if (sessionStorage.getItem("tiktok_vc_tracked")) return;
  sessionStorage.setItem("tiktok_vc_tracked", "true");

  const eventId = generateTikTokEventId("view");

  window.ttq.track(
    "ViewContent",
    {
      content_id: product.id,
      content_name: product.name,
      content_type: "product",
      value: product.price,
      currency: "BRL",
    },
    { event_id: eventId }
  );

  console.log("[TikTok Pixel] ViewContent tracked:", { product, eventId });
}

/**
 * AddToCart Tracking (Triggered when user clicks buy/adds to cart)
 */
export function trackTikTokAddToCart(
  product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  },
  customEventId?: string
): void {
  if (typeof window === "undefined" || !window.ttq) return;

  const eventId = customEventId || generateTikTokEventId("cart");
  const totalValue = Number((product.price * product.quantity).toFixed(2));

  window.ttq.track(
    "AddToCart",
    {
      content_id: product.id,
      content_name: product.name,
      content_type: "product",
      quantity: product.quantity,
      value: totalValue,
      currency: "BRL",
      contents: [
        {
          content_id: product.id,
          content_name: product.name,
          quantity: product.quantity,
          price: product.price,
        },
      ],
    },
    { event_id: eventId }
  );

  console.log("[TikTok Pixel] AddToCart tracked:", { product, totalValue, eventId });
}

/**
 * InitiateCheckout Tracking (Triggered ONCE when user proceeds to checkout)
 */
let checkoutTrackedForSession = false;
export function trackTikTokInitiateCheckout(
  product: { id: string; name: string; price: number; quantity: number },
  customEventId?: string
): string {
  const eventId = customEventId || generateTikTokEventId("checkout");

  if (typeof window === "undefined" || !window.ttq) return eventId;
  if (checkoutTrackedForSession || sessionStorage.getItem("tiktok_ic_tracked")) {
    return eventId;
  }

  checkoutTrackedForSession = true;
  sessionStorage.setItem("tiktok_ic_tracked", "true");

  const totalValue = Number((product.price * product.quantity).toFixed(2));

  window.ttq.track(
    "InitiateCheckout",
    {
      content_id: product.id,
      content_name: product.name,
      content_type: "product",
      quantity: product.quantity,
      value: totalValue,
      currency: "BRL",
      contents: [
        {
          content_id: product.id,
          content_name: product.name,
          quantity: product.quantity,
          price: product.price,
        },
      ],
    },
    { event_id: eventId }
  );

  console.log("[TikTok Pixel] InitiateCheckout tracked:", { product, totalValue, eventId });
  return eventId;
}

/**
 * CompletePayment Tracking immediately on Pix order creation
 * event_id matches purchase_${order.id} for server deduplication
 */
export function trackTikTokCompletePayment(
  order: { id: string; total: number },
  customEventId?: string
): void {
  if (typeof window === "undefined" || !window.ttq) return;

  const eventId = customEventId || `purchase_${order.id}`;

  window.ttq.track(
    "CompletePayment",
    {
      content_id: "CMFBPM001-BFPP",
      content_type: "product",
      value: Number(order.total.toFixed(2)),
      currency: "BRL",
      contents: [
        {
          content_id: "CMFBPM001-BFPP",
          quantity: 1,
          price: Number(order.total.toFixed(2)),
        },
      ],
    },
    { event_id: eventId }
  );

  console.log("[TikTok Pixel] CompletePayment tracked immediately on Pix creation:", { order, eventId });
}
