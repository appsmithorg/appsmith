/**
 * Uppy locale helpers for FilePickerWidgetV2.
 * Pure functions — callers pass htmlLang / locale; no Redux store access here.
 */

/**
 * Uppy locale object shape used by @uppy/core / @uppy/dashboard / @uppy/locales.
 */
export interface UppyLocale {
  strings: Record<string, string | Record<string, string>>;
  pluralize: (n: number) => number;
}

/** Matches @uppy/dashboard default for xFilesSelected (English). */
export const ENGLISH_X_FILES_SELECTED: Record<string, string> = {
  "0": "%{smart_count} file selected",
  "1": "%{smart_count} files selected",
};

const ENGLISH_PLURALIZE = (n: number) => (n === 1 ? 0 : 1);

/**
 * Preferred Uppy pack when the app only sets a language subtag (e.g. "de").
 * Keys are lowercase BCP 47 primary language subtags.
 */
const PREFERRED_LOCALE_BY_LANGUAGE: Record<string, string> = {
  ar: "ar_SA",
  bg: "bg_BG",
  cs: "cs_CZ",
  da: "da_DK",
  de: "de_DE",
  el: "el_GR",
  es: "es_ES",
  fa: "fa_IR",
  fi: "fi_FI",
  fr: "fr_FR",
  gl: "gl_ES",
  he: "he_IL",
  hr: "hr_HR",
  hu: "hu_HU",
  id: "id_ID",
  is: "is_IS",
  it: "it_IT",
  ja: "ja_JP",
  ko: "ko_KR",
  nb: "nb_NO",
  nn: "nb_NO",
  no: "nb_NO",
  nl: "nl_NL",
  pl: "pl_PL",
  pt: "pt_BR",
  ro: "ro_RO",
  ru: "ru_RU",
  sk: "sk_SK",
  sr: "sr_RS_Latin",
  sv: "sv_SE",
  th: "th_TH",
  tr: "tr_TR",
  uk: "uk_UA",
  vi: "vi_VN",
  zh: "zh_CN",
};

/**
 * Dynamic import map so webpack can code-split locale packs with the Uppy chunk.
 * Ids match @uppy/locales@1.22 filenames (excluding en_US — we use built-in English).
 */
const LOCALE_LOADERS: Record<string, () => Promise<{ default: UppyLocale }>> = {
  ar_SA: async () => import("@uppy/locales/lib/ar_SA"),
  bg_BG: async () => import("@uppy/locales/lib/bg_BG"),
  cs_CZ: async () => import("@uppy/locales/lib/cs_CZ"),
  da_DK: async () => import("@uppy/locales/lib/da_DK"),
  de_DE: async () => import("@uppy/locales/lib/de_DE"),
  el_GR: async () => import("@uppy/locales/lib/el_GR"),
  es_ES: async () => import("@uppy/locales/lib/es_ES"),
  es_GL: async () => import("@uppy/locales/lib/es_GL"),
  fa_IR: async () => import("@uppy/locales/lib/fa_IR"),
  fi_FI: async () => import("@uppy/locales/lib/fi_FI"),
  fr_FR: async () => import("@uppy/locales/lib/fr_FR"),
  gl_ES: async () => import("@uppy/locales/lib/gl_ES"),
  he_IL: async () => import("@uppy/locales/lib/he_IL"),
  hr_HR: async () => import("@uppy/locales/lib/hr_HR"),
  hu_HU: async () => import("@uppy/locales/lib/hu_HU"),
  id_ID: async () => import("@uppy/locales/lib/id_ID"),
  is_IS: async () => import("@uppy/locales/lib/is_IS"),
  it_IT: async () => import("@uppy/locales/lib/it_IT"),
  ja_JP: async () => import("@uppy/locales/lib/ja_JP"),
  ko_KR: async () => import("@uppy/locales/lib/ko_KR"),
  nb_NO: async () => import("@uppy/locales/lib/nb_NO"),
  nl_NL: async () => import("@uppy/locales/lib/nl_NL"),
  pl_PL: async () => import("@uppy/locales/lib/pl_PL"),
  pt_BR: async () => import("@uppy/locales/lib/pt_BR"),
  pt_PT: async () => import("@uppy/locales/lib/pt_PT"),
  ro_RO: async () => import("@uppy/locales/lib/ro_RO"),
  ru_RU: async () => import("@uppy/locales/lib/ru_RU"),
  sk_SK: async () => import("@uppy/locales/lib/sk_SK"),
  sr_RS_Cyrillic: async () => import("@uppy/locales/lib/sr_RS_Cyrillic"),
  sr_RS_Latin: async () => import("@uppy/locales/lib/sr_RS_Latin"),
  sv_SE: async () => import("@uppy/locales/lib/sv_SE"),
  th_TH: async () => import("@uppy/locales/lib/th_TH"),
  tr_TR: async () => import("@uppy/locales/lib/tr_TR"),
  uk_UA: async () => import("@uppy/locales/lib/uk_UA"),
  vi_VN: async () => import("@uppy/locales/lib/vi_VN"),
  zh_CN: async () => import("@uppy/locales/lib/zh_CN"),
  zh_TW: async () => import("@uppy/locales/lib/zh_TW"),
};

const LOCALE_IDS = Object.keys(LOCALE_LOADERS);

/**
 * Module cache is keyed by resolved Uppy locale id (or "en").
 * One app has one htmlLang, so all FilePickers share the same pack.
 * Multi-language-per-page is out of scope.
 *
 * Concurrent callers share an in-flight Promise per key. Settled cache
 * updates only when the completed key is still the latest requested key,
 * so a slower load cannot overwrite a newer language.
 */
let settledCacheKey: string | null = null;
let settledLocale: UppyLocale | null = null;
let latestRequestedKey: string | null = null;
const inflightByKey = new Map<string, Promise<UppyLocale | null>>();

type LocaleLoader = (localeId: string) => Promise<UppyLocale | null>;
let localeLoader: LocaleLoader | null = null;

/**
 * Typed empty locale for Uppy / plugin setOptions when falling back to English.
 * Uppy merges missing string keys with its built-in English defaults.
 */
export const EMPTY_UPPY_LOCALE: UppyLocale = {
  strings: {},
  pluralize: ENGLISH_PLURALIZE,
};

/** Dashboard / Webcam locale option with required `strings` (never a bare `{}`). */
export interface UppyPluginLocaleOption {
  strings: Record<string, string>;
}

export const EMPTY_PLUGIN_LOCALE: UppyPluginLocaleOption = { strings: {} };

export function isEnglishHtmlLang(htmlLang: string): boolean {
  const primary = htmlLang
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .split("-")[0];

  return !primary || primary === "en";
}

/**
 * Map a BCP 47 / HTML lang value to an @uppy/locales id.
 * Returns null for English or unsupported languages (caller uses English defaults).
 */
export function resolveUppyLocaleId(htmlLang: string): string | null {
  const trimmed = htmlLang?.trim();

  if (!trimmed || isEnglishHtmlLang(trimmed)) {
    return null;
  }

  const normalized = trimmed.replace(/-/g, "_");
  const parts = normalized.split("_").filter(Boolean);
  const language = parts[0]?.toLowerCase();
  const rest = parts.slice(1).join("_");

  if (!language) {
    return null;
  }

  // Traditional Chinese script/region tags → zh_TW (not preferred zh_CN).
  if (language === "zh" && /^(hant|tw|hk|mo)(_|$)/i.test(rest)) {
    return "zh_TW";
  }

  const exactCandidate = rest
    ? `${language}_${rest}`
    : PREFERRED_LOCALE_BY_LANGUAGE[language];

  if (exactCandidate) {
    const exactMatch = LOCALE_IDS.find(
      (id) => id.toLowerCase() === exactCandidate.toLowerCase(),
    );

    if (exactMatch) {
      return exactMatch;
    }
  }

  // Region variants such as de_AT → de_DE via preferred language pack.
  const preferred = PREFERRED_LOCALE_BY_LANGUAGE[language];

  if (preferred && LOCALE_LOADERS[preferred]) {
    return preferred;
  }

  const prefixMatch = LOCALE_IDS.find((id) =>
    id.toLowerCase().startsWith(`${language}_`),
  );

  return prefixMatch ?? null;
}

async function loadUppyLocaleById(
  localeId: string,
): Promise<UppyLocale | null> {
  const loader = LOCALE_LOADERS[localeId];

  if (!loader) {
    return null;
  }

  const mod = await loader();
  // CJS packs expose the locale as default under webpack / Jest interop.
  const locale = (mod as { default?: UppyLocale }).default ?? mod;

  return locale as UppyLocale;
}

/**
 * Load and cache the Uppy locale for the given HTML lang.
 * English / unsupported → null (Uppy built-in English strings).
 */
export async function ensureUppyLocale(
  htmlLang: string,
): Promise<UppyLocale | null> {
  const localeId = resolveUppyLocaleId(htmlLang);
  const cacheKey = localeId ?? "en";

  // Settled hits must not bump latestRequestedKey — that would let a
  // concurrent newer load finish without settling (cache poison).
  if (settledCacheKey === cacheKey && !inflightByKey.has(cacheKey)) {
    return settledLocale;
  }

  latestRequestedKey = cacheKey;

  let loadPromise = inflightByKey.get(cacheKey);

  if (!loadPromise) {
    loadPromise = (async (): Promise<UppyLocale | null> => {
      if (!localeId) {
        return null;
      }

      const load = localeLoader ?? loadUppyLocaleById;

      return load(localeId);
    })();
    inflightByKey.set(cacheKey, loadPromise);
  }

  try {
    const locale = await loadPromise;

    if (latestRequestedKey === cacheKey) {
      settledCacheKey = cacheKey;
      settledLocale = locale;
    }

    return locale;
  } catch {
    // Pack load failed — do not settle, so a later call can retry.
    // Callers treat null as English defaults for this attempt.
    return null;
  } finally {
    if (inflightByKey.get(cacheKey) === loadPromise) {
      inflightByKey.delete(cacheKey);
    }
  }
}

/** Test helper — clears the module locale cache and in-flight loads. */
export function resetUppyLocaleCache(): void {
  settledCacheKey = null;
  settledLocale = null;
  latestRequestedKey = null;
  inflightByKey.clear();
  localeLoader = null;
}

/** Test helper — inject a locale loader (e.g. delayed) to exercise concurrency. */
export function setUppyLocaleLoaderForTests(loader: LocaleLoader | null): void {
  localeLoader = loader;
}

/**
 * Canvas button label when files are selected — Uppy `xFilesSelected`.
 * Packs may supply a plural object or a single string (e.g. zh_CN, ko_KR).
 */
export function formatXFilesSelected(
  count: number,
  locale: UppyLocale | null = null,
): string {
  const xFilesSelected = locale?.strings?.xFilesSelected;
  let template: string;

  if (typeof xFilesSelected === "string") {
    template = xFilesSelected;
  } else {
    const forms =
      xFilesSelected && typeof xFilesSelected === "object"
        ? (xFilesSelected as Record<string, string>)
        : ENGLISH_X_FILES_SELECTED;
    const pluralize = locale?.pluralize ?? ENGLISH_PLURALIZE;
    const formIndex = pluralize(count);

    template =
      forms[String(formIndex)] ?? forms["1"] ?? ENGLISH_X_FILES_SELECTED["1"];
  }

  return template.replace(/%\{smart_count\}/g, String(count));
}

/**
 * Dashboard locale option: keep Appsmith's short English close label;
 * for other languages re-assert the pack's closeModal so a prior English
 * override does not stick after setOptions merge.
 */
export function getDashboardLocaleOption(
  htmlLang: string,
  uppyLocale: UppyLocale | null,
): UppyPluginLocaleOption {
  if (isEnglishHtmlLang(htmlLang) || !uppyLocale) {
    return {
      strings: {
        closeModal: "Close",
      },
    };
  }

  const closeModal = uppyLocale.strings.closeModal;

  if (typeof closeModal === "string") {
    return { strings: { closeModal } };
  }

  return EMPTY_PLUGIN_LOCALE;
}
