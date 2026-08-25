import { getStoredUTMParams, type UTMParams } from '../utils/utm';

export type EventType =
  | 'session_started'
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'checkout_started'
  | 'checkout_contact_submitted'
  | 'payment_method_selected'
  | 'pix_generated'
  | 'pix_copied'
  | 'order_created'
  | 'payment_pending'
  | 'payment_approved'
  | 'payment_failed'
  | 'card_declined'
  | 'purchase';

export interface ClientDeviceInfo {
  device: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser: string;
  screenResolution: string;
  language: string;
}

export interface SessionData {
  visitorId: string;
  visitorCode: string;
  sessionId: string;
  currentPath: string;
  startedAt: string;
  deviceInfo: ClientDeviceInfo;
  utmParams: UTMParams;
  customerData?: {
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
  };
}

const VISITOR_STORAGE_KEY = 'miracle_visitor_id';
const VISITOR_CODE_STORAGE_KEY = 'miracle_visitor_code';
const SESSION_STORAGE_KEY = 'miracle_session_id';
const SENT_EVENTS_SET = new Set<string>();

/**
 * Generate anonymous friendly code (e.g. #A81F)
 */
function generateVisitorCode(): string {
  const chars = '0123456789ABCDEF';
  let code = '#';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get or create permanent Visitor ID
 */
export function getOrCreateVisitorId(): { visitorId: string; visitorCode: string } {
  if (typeof window === 'undefined') {
    return { visitorId: 'v_server', visitorCode: '#0000' };
  }

  let visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);
  let visitorCode = localStorage.getItem(VISITOR_CODE_STORAGE_KEY);

  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    visitorCode = generateVisitorCode();
    try {
      localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
      localStorage.setItem(VISITOR_CODE_STORAGE_KEY, visitorCode);
    } catch {}
  }

  return { visitorId, visitorCode: visitorCode || '#A81F' };
}

/**
 * Get or create unique Session ID
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'sess_server';

  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } catch {}
  }
  return sessionId;
}

/**
 * Parse passive device and browser info
 */
export function detectDeviceInfo(): ClientDeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { device: 'desktop', os: 'Unknown', browser: 'Unknown', screenResolution: '1920x1080', language: 'pt-BR' };
  }

  const ua = navigator.userAgent;
  let device: 'mobile' | 'desktop' | 'tablet' = 'desktop';

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
    device = 'mobile';
  }

  let os = 'Unknown OS';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown Browser';
  if (/Chrome|CriOS/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  return {
    device,
    os,
    browser,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language || 'pt-BR'
  };
}

let isInitialized = false;
let heartbeatInterval: any = null;

/**
 * Initialize Live Tracker and Start Heartbeat
 */
export function initLiveTracker(): void {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  const { visitorCode } = getOrCreateVisitorId();
  const deviceInfo = detectDeviceInfo();
  const utmParams = getStoredUTMParams();

  // Send initial session_started event
  trackLiveEvent('session_started', {
    path: window.location.pathname,
    deviceInfo,
    utmParams,
    visitorCode
  });

  // Track initial page_view
  trackLiveEvent('page_view', {
    path: window.location.pathname,
    title: document.title
  });

  // Start continuous heartbeat (every 10 seconds)
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    sendHeartbeat();
  }, 10000);

  // Send heartbeat on focus or visibility change
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      sendHeartbeat();
    }
  });
}

/**
 * Send Heartbeat Ping to Backend
 */
export async function sendHeartbeat(): Promise<void> {
  if (typeof window === 'undefined') return;

  const { visitorId, visitorCode } = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();
  const currentPath = window.location.pathname;

  const payload = {
    visitorId,
    visitorCode,
    sessionId,
    currentPath,
    timestamp: new Date().toISOString()
  };

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/track/heartbeat', blob);
    } else {
      fetch('/api/track/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    }
  } catch {}
}

/**
 * Track Live Semantic Event with Strict Deduplication Guard
 */
export async function trackLiveEvent(
  eventType: EventType,
  metadata: Record<string, any> = {},
  customEventId?: string
): Promise<string> {
  if (typeof window === 'undefined') return '';

  const { visitorId, visitorCode } = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();
  const currentPath = metadata.path || window.location.pathname;
  const utmParams = getStoredUTMParams();
  const deviceInfo = detectDeviceInfo();

  // Deduplication Key
  const eventId = customEventId || `${eventType}_${sessionId}_${metadata.orderId || metadata.productId || currentPath}`;

  // Protect against duplicate idempotent events in the same session
  if (['checkout_started', 'pix_generated', 'order_created', 'session_started'].includes(eventType)) {
    if (SENT_EVENTS_SET.has(eventId)) {
      return eventId;
    }
    SENT_EVENTS_SET.add(eventId);
  }

  const payload = {
    eventId,
    eventType,
    visitorId,
    visitorCode,
    sessionId,
    path: currentPath,
    deviceInfo,
    utmParams,
    metadata,
    timestamp: new Date().toISOString()
  };

  // Dispatch asynchronously to server
  try {
    fetch('/api/track/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Fail silently to never impact user checkout experience
    });
  } catch {}

  return eventId;
}

/**
 * Associate voluntarily submitted customer details with the session (Progressive ID)
 */
export function associateCustomerWithSession(customer: {
  name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
}): void {
  if (typeof window === 'undefined') return;

  const { visitorId } = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();

  trackLiveEvent('checkout_contact_submitted', {
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      cpf: customer.cpf
    }
  });

  try {
    fetch('/api/track/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        sessionId,
        customer
      })
    }).catch(() => {});
  } catch {}
}
