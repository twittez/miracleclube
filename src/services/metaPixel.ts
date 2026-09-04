declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const META_PIXEL_ID = "2645703275845738";

let isInitialized = false;

/**
 * Initialize Meta Pixel Base Script (Only once)
 */
export function initMetaPixel(): void {
  if (typeof window === "undefined" || isInitialized) return;

  if (window.fbq) {
    isInitialized = true;
    return;
  }

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
  isInitialized = true;

  console.log(`[Meta Pixel] Initialized successfully with ID: ${META_PIXEL_ID}`);
}

/**
 * Generate Event ID for deduplication
 */
export function generateEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * PageView Tracking (With route change protection)
 */
let lastTrackedPath = "";
export function trackPageView(pathName?: string): void {
  if (typeof window === "undefined" || !window.fbq) return;

  const currentPath = pathName || window.location.pathname;
  if (currentPath === lastTrackedPath) return;

  lastTrackedPath = currentPath;
  window.fbq("track", "PageView");
  console.log(`[Meta Pixel] PageView tracked for path: ${currentPath}`);
}

/**
 * ViewContent Tracking (Product Page View)
 */
export function trackViewContent(product: {
  id: string;
  name: string;
  price: number;
}): void {
  if (typeof window === "undefined" || !window.fbq) return;

  if (sessionStorage.getItem("meta_vc_tracked")) return;
  sessionStorage.setItem("meta_vc_tracked", "true");

  const eventId = generateEventId("view");

  window.fbq(
    "track",
    "ViewContent",
    {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value: product.price,
      currency: "BRL",
    },
    { eventID: eventId }
  );

  console.log("[Meta Pixel] ViewContent tracked:", product);
}

/**
 * AddToCart Tracking (Triggered ONLY when user adds item to cart)
 */
export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}): void {
  if (typeof window === "undefined" || !window.fbq) return;

  const eventId = generateEventId("cart");
  const totalValue = Number((product.price * product.quantity).toFixed(2));

  window.fbq(
    "track",
    "AddToCart",
    {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      contents: [
        {
          id: product.id,
          quantity: product.quantity,
          item_price: product.price,
        },
      ],
      value: totalValue,
      currency: "BRL",
    },
    { eventID: eventId }
  );

  console.log("[Meta Pixel] AddToCart tracked:", { product, totalValue, eventId });
}

/**
 * InitiateCheckout Tracking (Triggered ONCE when user proceeds to checkout)
 */
let checkoutTrackedForSession = false;
export function trackInitiateCheckout(
  product: { id: string; name: string; price: number; quantity: number },
  customEventId?: string
): string {
  const eventId = customEventId || generateEventId("checkout");

  if (typeof window === "undefined" || !window.fbq) return eventId;
  if (checkoutTrackedForSession || sessionStorage.getItem("meta_ic_tracked")) {
    return eventId;
  }

  checkoutTrackedForSession = true;
  sessionStorage.setItem("meta_ic_tracked", "true");

  const totalValue = Number((product.price * product.quantity).toFixed(2));

  window.fbq(
    "track",
    "InitiateCheckout",
    {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      contents: [
        {
          id: product.id,
          quantity: product.quantity,
          item_price: product.price,
        },
      ],
      value: totalValue,
      currency: "BRL",
    },
    { eventID: eventId }
  );

  console.log("[Meta Pixel] InitiateCheckout tracked:", { product, totalValue, eventId });
  return eventId;
}

/**
 * Track Purchase event ONLY when the order is confirmed as PAID
 */
export function trackPurchase(
  order: { id: string; total: number },
  customEventId?: string
): void {
  if (typeof window === "undefined" || !window.fbq) return;

  const eventId = customEventId || `purchase_${order.id}`;

  window.fbq(
    "track",
    "Purchase",
    {
      value: Number(order.total.toFixed(2)),
      currency: "BRL",
      content_type: "product",
      content_ids: ["CMFBPM001-BFPP"],
      order_id: order.id,
    },
    { eventID: eventId }
  );

  console.log("[Meta Pixel] Purchase tracked for PAID order:", { order, eventId });
}

/**
 * Track Custom PixGenerated event (Optional custom metric for pending PIX - NOT Purchase)
 */
export function trackPixGenerated(order: { id: string; total: number }): void {
  if (typeof window === "undefined" || !window.fbq) return;

  window.fbq(
    "trackCustom",
    "PixGenerated",
    {
      value: Number(order.total.toFixed(2)),
      currency: "BRL",
      order_id: order.id,
    },
    { eventID: `pix_gen_${order.id}` }
  );

  console.log("[Meta Pixel] PixGenerated custom metric tracked:", { order });
}
