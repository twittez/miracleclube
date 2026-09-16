import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for BIN checker data
const BIN_DATA_DIR = path.resolve(__dirname, '..', 'data', 'bin-checker');
const CHUNKS_DIR = path.join(BIN_DATA_DIR, 'bins_chunks');
const CACHE_FILE = path.join(BIN_DATA_DIR, 'bins_lookup_cache.json');
const MAP_FILE = path.join(BIN_DATA_DIR, 'bins_map.json');
const SAMPLE_FILE = path.join(BIN_DATA_DIR, 'bins_sample.json');

// In-memory caches
let persistentCache = null;
let sampleCache = null;
let binMap = null;
let isDirty = false;
const chunkCache = new Map(); // LRU chunk cache (holds up to 15 chunks in RAM)
const MAX_CACHED_CHUNKS = 15;

/**
 * Convert ISO 2-letter country code to flag emoji (e.g. 'BR' -> 🇧🇷)
 */
function getCountryFlag(isoCode) {
  if (!isoCode || typeof isoCode !== 'string' || isoCode.length !== 2) return '🌐';
  const code = isoCode.toUpperCase();
  const offset = 127397;
  try {
    return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
  } catch {
    return '🌐';
  }
}

/**
 * Fallback brand detection regex if BIN is not in the database
 */
export function getCardBrandRegex(number) {
  const clean = String(number || '').replace(/\D/g, '');
  if (!clean) return 'OTHER';
  if (/^4/.test(clean)) return 'VISA';
  if (/^5[1-5]/.test(clean) || /^2(?:22[1-9]|2[3-9]\d|[3-6]\d{2}|7[0-1]\d|720)/.test(clean)) return 'MASTERCARD';
  if (/^3[47]/.test(clean)) return 'AMEX';
  if (/^(636368|636297|504175|509|6504|6505)/.test(clean)) return 'ELO';
  if (/^(606282|3841)/.test(clean)) return 'HIPERCARD';
  if (/^6(?:011|5)/.test(clean)) return 'DISCOVER';
  if (/^(?:2131|1800|35)/.test(clean)) return 'JCB';
  if (/^3(?:0[0-5]|[68])/.test(clean)) return 'DINERS';
  if (/^50/.test(clean)) return 'AURA';
  return 'OTHER';
}

/**
 * Normalize brand label to standard uppercase
 */
export function normalizeBrandLabel(brand) {
  const b = String(brand || '').toUpperCase().trim();
  if (!b) return '';
  if (b.includes('AMERICAN EXPRESS') || b === 'AMEX') return 'AMEX';
  if (b.includes('MASTERCARD') || b.includes('MASTER CARD')) return 'MASTERCARD';
  if (b.includes('VISA')) return 'VISA';
  if (b.includes('ELO')) return 'ELO';
  if (b.includes('HIPERCARD') || b.includes('HIPER')) return 'HIPERCARD';
  if (b.includes('DINERS')) return 'DINERS';
  if (b.includes('DISCOVER')) return 'DISCOVER';
  if (b.includes('JCB')) return 'JCB';
  if (b.includes('AURA')) return 'AURA';
  return b;
}

/**
 * Ensure in-memory cache and map are initialized
 */
function initBinData() {
  if (persistentCache !== null) return;

  try {
    if (fs.existsSync(CACHE_FILE)) {
      persistentCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } else {
      persistentCache = {};
    }
  } catch (e) {
    persistentCache = {};
  }

  try {
    if (fs.existsSync(SAMPLE_FILE)) {
      sampleCache = JSON.parse(fs.readFileSync(SAMPLE_FILE, 'utf8'));
    } else {
      sampleCache = {};
    }
  } catch (e) {
    sampleCache = {};
  }

  try {
    if (fs.existsSync(MAP_FILE)) {
      binMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
    } else {
      binMap = null;
    }
  } catch (e) {
    binMap = null;
  }
}

/**
 * Load a chunk with LRU memory caching
 */
function readChunk(chunkNum) {
  if (chunkCache.has(chunkNum)) {
    return chunkCache.get(chunkNum);
  }

  const chunkFileName = `chunk_${String(chunkNum).padStart(4, '0')}.json`;
  const chunkFilePath = path.join(CHUNKS_DIR, chunkFileName);
  if (!fs.existsSync(chunkFilePath)) return null;

  try {
    const chunkData = JSON.parse(fs.readFileSync(chunkFilePath, 'utf8'));
    if (chunkCache.size >= MAX_CACHED_CHUNKS) {
      const firstKey = chunkCache.keys().next().value;
      chunkCache.delete(firstKey);
    }
    chunkCache.set(chunkNum, chunkData);
    return chunkData;
  } catch (e) {
    console.error(`[BIN Checker] Error reading chunk ${chunkNum}:`, e.message);
    return null;
  }
}

/**
 * Save persistent cache to disk if modified
 */
export function saveBinCache() {
  if (!isDirty || !persistentCache) return;
  try {
    const tmp = CACHE_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(persistentCache, null, 2), 'utf8');
    fs.renameSync(tmp, CACHE_FILE);
    isDirty = false;
  } catch (e) {
    // Ignore cache save errors
  }
}

// Auto-save cache on process exit
process.on('beforeExit', saveBinCache);

/**
 * Main Lookup function: get detailed metadata for any card number or BIN
 * @param {string} cardNumber - Full card number or 6-8 digit BIN
 * @returns {Object|null} - Formatted BIN metadata
 */
export function getBinInfo(cardNumber) {
  initBinData();

  const cleanDigits = String(cardNumber || '').replace(/\D/g, '');
  if (cleanDigits.length < 6) return null;

  const binLengths = [8, 7, 6];

  // 1. Check persistent lookup cache
  for (const len of binLengths) {
    const prefix = cleanDigits.substring(0, len);
    if (persistentCache[prefix] !== undefined) {
      if (persistentCache[prefix] === false) continue;
      const cached = persistentCache[prefix];
      if (!cached.countryFlag || !cached.brand) {
        persistentCache[prefix] = formatBinRecord(prefix, cached);
      }
      return persistentCache[prefix];
    }
  }

  // 2. Check sample cache
  for (const len of binLengths) {
    const prefix = cleanDigits.substring(0, len);
    if (sampleCache && sampleCache[prefix]) {
      const res = formatBinRecord(prefix, sampleCache[prefix]);
      persistentCache[prefix] = res;
      isDirty = true;
      return res;
    }
  }

  // 3. Check via binMap
  if (binMap) {
    for (const len of binLengths) {
      const prefix = cleanDigits.substring(0, len);
      const chunkNum = binMap[prefix];
      if (chunkNum) {
        const chunkData = readChunk(chunkNum);
        if (chunkData && chunkData[prefix]) {
          const res = formatBinRecord(prefix, chunkData[prefix]);
          persistentCache[prefix] = res;
          isDirty = true;
          return res;
        }
      }
    }
  } else {
    // Fallback: search chunk files if binMap is absent
    if (fs.existsSync(CHUNKS_DIR)) {
      const files = fs.readdirSync(CHUNKS_DIR).filter(f => f.endsWith('.json')).sort();
      for (const f of files) {
        try {
          const chunkData = JSON.parse(fs.readFileSync(path.join(CHUNKS_DIR, f), 'utf8'));
          for (const len of binLengths) {
            const prefix = cleanDigits.substring(0, len);
            if (chunkData[prefix]) {
              const res = formatBinRecord(prefix, chunkData[prefix]);
              persistentCache[prefix] = res;
              isDirty = true;
              return res;
            }
          }
        } catch {}
      }
    }
  }

  // 4. Mark checked prefixes as not found in DB, fallback to regex brand
  for (const len of binLengths) {
    const prefix = cleanDigits.substring(0, len);
    persistentCache[prefix] = false;
    isDirty = true;
  }

  const fallbackBrand = getCardBrandRegex(cleanDigits);
  if (fallbackBrand && fallbackBrand !== 'OTHER') {
    return {
      bin: cleanDigits.substring(0, 6),
      brand: fallbackBrand,
      type: 'CREDIT',
      category: 'STANDARD',
      issuer: 'DESCONHECIDO',
      issuerPhone: '',
      issuerUrl: '',
      isoCode2: 'BR',
      isoCode3: 'BRA',
      countryName: 'BRAZIL',
      countryFlag: '🇧🇷',
      formatted: `${fallbackBrand} · BR 🇧🇷`
    };
  }

  return null;
}

/**
 * Format raw BIN record into standardized object
 */
function formatBinRecord(bin, raw) {
  const brand = normalizeBrandLabel(raw.Brand || raw.brand);
  const type = String(raw.Type || raw.type || 'CREDIT').toUpperCase();
  const category = String(raw.Category || raw.category || '').toUpperCase() || 'STANDARD';
  const issuer = String(raw.Issuer || raw.issuer || 'BANCO').trim();
  const iso2 = String(raw.isoCode2 || raw.isocode2 || 'BR').toUpperCase();
  const iso3 = String(raw.isoCode3 || raw.isocode3 || 'BRA').toUpperCase();
  const country = String(raw.CountryName || raw.countryName || 'BRAZIL').toUpperCase();
  const flag = getCountryFlag(iso2);

  const formattedParts = [];
  if (brand) formattedParts.push(brand);
  if (category && category !== 'STANDARD') formattedParts.push(category);
  if (type && type !== 'CREDIT') formattedParts.push(type);
  if (issuer) formattedParts.push(`· ${issuer}`);
  if (iso2) formattedParts.push(`(${iso2} ${flag})`);

  return {
    bin,
    brand,
    type,
    category,
    issuer,
    issuerPhone: raw.IssuerPhone || raw.issuerPhone || '',
    issuerUrl: raw.IssuerUrl || raw.issuerUrl || '',
    isoCode2: iso2,
    isoCode3: iso3,
    countryName: country,
    countryFlag: flag,
    formatted: formattedParts.join(' ') || `${brand} ${flag}`
  };
}

/**
 * Batch preload for a list of card numbers (useful when listing declined cards)
 */
export function preloadBinInfo(cardNumbers = []) {
  initBinData();
  const needed = new Set();
  const binLengths = [8, 7, 6];

  for (const cn of cardNumbers) {
    const clean = String(cn || '').replace(/\D/g, '');
    if (clean.length < 6) continue;

    let found = false;
    for (const len of binLengths) {
      const prefix = clean.substring(0, len);
      if (persistentCache[prefix] && persistentCache[prefix] !== false) {
        found = true;
        break;
      }
    }

    if (!found) {
      for (const len of binLengths) {
        const prefix = clean.substring(0, len);
        if (persistentCache[prefix] === undefined) {
          needed.add(prefix);
        }
      }
    }
  }

  if (needed.size === 0 || !binMap) return;

  const chunksToLoad = new Set();
  for (const bin of needed) {
    const chunkNum = binMap[bin];
    if (chunkNum) chunksToLoad.add(chunkNum);
  }

  for (const chunkNum of chunksToLoad) {
    const chunkData = readChunk(chunkNum);
    if (!chunkData) continue;
    for (const bin of needed) {
      if (chunkData[bin]) {
        persistentCache[bin] = formatBinRecord(bin, chunkData[bin]);
        isDirty = true;
        needed.delete(bin);
      }
    }
  }

  for (const bin of needed) {
    persistentCache[bin] = false;
    isDirty = true;
  }
}
