export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  fbp?: string;
  fbc?: string;
  user_agent?: string;
}

const STORAGE_KEY = "miracle_utm_params";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}

export function captureUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};

  const urlParams = new URLSearchParams(window.location.search);
  const keys: (keyof UTMParams)[] = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "fbclid",
    "gclid",
  ];

  const currentParams: UTMParams = {};
  let hasNew = false;

  keys.forEach((key) => {
    const val = urlParams.get(key);
    if (val) {
      currentParams[key] = val;
      hasNew = true;
    }
  });

  // Meta Cookies (_fbp, _fbc)
  const fbp = getCookie("_fbp");
  if (fbp) currentParams.fbp = fbp;

  let fbc = getCookie("_fbc");
  const fbclid = currentParams.fbclid || urlParams.get("fbclid");
  if (!fbc && fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  if (fbc) currentParams.fbc = fbc;

  if (typeof navigator !== "undefined") {
    currentParams.user_agent = navigator.userAgent;
  }

  const existing = getStoredUTMParams();
  const merged = { ...existing, ...currentParams };

  if (hasNew || fbp || fbc) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {}
  }

  return merged;
}

export function getStoredUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
