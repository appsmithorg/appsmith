import {
  ENGLISH_X_FILES_SELECTED,
  ensureUppyLocale,
  formatXFilesSelected,
  getDashboardLocaleOption,
  isEnglishHtmlLang,
  resetUppyLocaleCache,
  resolveUppyLocaleId,
  setUppyLocaleLoaderForTests,
  type UppyLocale,
} from "./uppyLocale";

describe("FilePicker Uppy locale helpers", () => {
  afterEach(() => {
    resetUppyLocaleCache();
  });

  describe("isEnglishHtmlLang", () => {
    it("treats empty, en, and en-* as English", () => {
      expect(isEnglishHtmlLang("")).toBe(true);
      expect(isEnglishHtmlLang("en")).toBe(true);
      expect(isEnglishHtmlLang("en-US")).toBe(true);
      expect(isEnglishHtmlLang("en_GB")).toBe(true);
    });

    it("treats non-English primary tags as not English", () => {
      expect(isEnglishHtmlLang("de")).toBe(false);
      expect(isEnglishHtmlLang("de-DE")).toBe(false);
      expect(isEnglishHtmlLang("fr")).toBe(false);
    });
  });

  describe("resolveUppyLocaleId", () => {
    it("returns null for English and unsupported languages", () => {
      expect(resolveUppyLocaleId("")).toBeNull();
      expect(resolveUppyLocaleId("en")).toBeNull();
      expect(resolveUppyLocaleId("en-US")).toBeNull();
      expect(resolveUppyLocaleId("xx")).toBeNull();
      expect(resolveUppyLocaleId("en-GB")).toBeNull();
    });

    it("maps language-only codes to preferred Uppy packs", () => {
      expect(resolveUppyLocaleId("de")).toBe("de_DE");
      expect(resolveUppyLocaleId("fr")).toBe("fr_FR");
      expect(resolveUppyLocaleId("ja")).toBe("ja_JP");
      expect(resolveUppyLocaleId("zh")).toBe("zh_CN");
      expect(resolveUppyLocaleId("pt")).toBe("pt_BR");
      expect(resolveUppyLocaleId("nb")).toBe("nb_NO");
      expect(resolveUppyLocaleId("no")).toBe("nb_NO");
      expect(resolveUppyLocaleId("nn")).toBe("nb_NO");
    });

    it("maps BCP 47 region tags to Uppy ids", () => {
      expect(resolveUppyLocaleId("de-DE")).toBe("de_DE");
      expect(resolveUppyLocaleId("zh-TW")).toBe("zh_TW");
      expect(resolveUppyLocaleId("pt-PT")).toBe("pt_PT");
      expect(resolveUppyLocaleId("sr-RS-Latin")).toBe("sr_RS_Latin");
    });

    it("maps Traditional Chinese script and region tags to zh_TW", () => {
      expect(resolveUppyLocaleId("zh-Hant")).toBe("zh_TW");
      expect(resolveUppyLocaleId("zh-HK")).toBe("zh_TW");
      expect(resolveUppyLocaleId("zh-MO")).toBe("zh_TW");
      expect(resolveUppyLocaleId("zh-Hant-TW")).toBe("zh_TW");
    });

    it("falls back to the preferred pack for unknown regions of a known language", () => {
      expect(resolveUppyLocaleId("de-AT")).toBe("de_DE");
      expect(resolveUppyLocaleId("fr-CA")).toBe("fr_FR");
      expect(resolveUppyLocaleId("zh-CN")).toBe("zh_CN");
    });
  });

  describe("formatXFilesSelected", () => {
    it("uses English singular and plural forms by default", () => {
      expect(formatXFilesSelected(1, null)).toBe("1 file selected");
      expect(formatXFilesSelected(2, null)).toBe("2 files selected");
      expect(formatXFilesSelected(0, null)).toBe("0 files selected");
    });

    it("uses the supplied Uppy locale pack", () => {
      const german: UppyLocale = {
        strings: {
          xFilesSelected: {
            "0": "%{smart_count} Datei ausgewählt",
            "1": "%{smart_count} Dateien ausgewählt",
          },
        },
        pluralize: (n) => (n === 1 ? 0 : 1),
      };

      expect(formatXFilesSelected(1, german)).toBe("1 Datei ausgewählt");
      expect(formatXFilesSelected(3, german)).toBe("3 Dateien ausgewählt");
    });

    it("uses a string xFilesSelected template (zh_CN / ko_KR style)", () => {
      const zhCN: UppyLocale = {
        strings: {
          xFilesSelected: "%{smart_count} 个文件待上传",
        },
        pluralize: () => 0,
      };

      expect(formatXFilesSelected(1, zhCN)).toBe("1 个文件待上传");
      expect(formatXFilesSelected(3, zhCN)).toBe("3 个文件待上传");
    });

    it("matches Dashboard English defaults", () => {
      expect(ENGLISH_X_FILES_SELECTED["0"]).toBe(
        "%{smart_count} file selected",
      );
      expect(ENGLISH_X_FILES_SELECTED["1"]).toBe(
        "%{smart_count} files selected",
      );
    });
  });

  describe("getDashboardLocaleOption", () => {
    it("keeps the Appsmith Close override for English", () => {
      expect(getDashboardLocaleOption("en", null)).toEqual({
        strings: { closeModal: "Close" },
      });
    });

    it("re-asserts the pack closeModal when a non-English pack is active", () => {
      const german: UppyLocale = {
        strings: { closeModal: "Modal schließen" },
        pluralize: (n) => (n === 1 ? 0 : 1),
      };

      expect(getDashboardLocaleOption("de", german)).toEqual({
        strings: { closeModal: "Modal schließen" },
      });
    });

    it("returns an empty strings object when the pack has no closeModal string", () => {
      const german: UppyLocale = {
        strings: {},
        pluralize: (n) => (n === 1 ? 0 : 1),
      };

      expect(getDashboardLocaleOption("de", german)).toEqual({ strings: {} });
    });
  });

  describe("ensureUppyLocale concurrency", () => {
    const german: UppyLocale = {
      strings: { closeModal: "Schließen" },
      pluralize: (n) => (n === 1 ? 0 : 1),
    };
    const french: UppyLocale = {
      strings: { closeModal: "Fermer" },
      pluralize: (n) => (n === 1 ? 0 : 1),
    };

    it("shares one in-flight load for concurrent same-key callers", async () => {
      let loadCount = 0;
      let release!: (locale: UppyLocale) => void;
      const gate = new Promise<UppyLocale>((resolve) => {
        release = resolve;
      });

      setUppyLocaleLoaderForTests(async () => {
        loadCount += 1;

        return gate;
      });

      const first = ensureUppyLocale("de");
      const second = ensureUppyLocale("de");

      release(german);

      const [a, b] = await Promise.all([first, second]);

      expect(loadCount).toBe(1);
      expect(a).toBe(german);
      expect(b).toBe(german);
      expect(await ensureUppyLocale("de")).toBe(german);
    });

    it("does not let a slower prior load overwrite a newer language", async () => {
      let releaseDe!: (locale: UppyLocale) => void;
      let releaseFr!: (locale: UppyLocale) => void;
      const deGate = new Promise<UppyLocale>((resolve) => {
        releaseDe = resolve;
      });
      const frGate = new Promise<UppyLocale>((resolve) => {
        releaseFr = resolve;
      });
      let deLoadCount = 0;
      let frLoadCount = 0;

      setUppyLocaleLoaderForTests(async (localeId) => {
        if (localeId === "de_DE") {
          deLoadCount += 1;

          return deGate;
        }

        if (localeId === "fr_FR") {
          frLoadCount += 1;

          return frGate;
        }

        return null;
      });

      const deRequest = ensureUppyLocale("de");
      const frRequest = ensureUppyLocale("fr");

      releaseFr(french);
      expect(await frRequest).toBe(french);

      releaseDe(german);
      expect(await deRequest).toBe(german);

      // Settled cache must remain French without reloading (settle-on-latest).
      expect(await ensureUppyLocale("fr")).toBe(french);
      expect(deLoadCount).toBe(1);
      expect(frLoadCount).toBe(1);
    });

    it("lets English settle and ignores a slower prior pack load", async () => {
      let releaseDe!: (locale: UppyLocale) => void;
      const deGate = new Promise<UppyLocale>((resolve) => {
        releaseDe = resolve;
      });
      let deLoadCount = 0;

      setUppyLocaleLoaderForTests(async (localeId) => {
        if (localeId === "de_DE") {
          deLoadCount += 1;

          return deGate;
        }

        return null;
      });

      const deRequest = ensureUppyLocale("de");
      const enRequest = ensureUppyLocale("en");

      expect(await enRequest).toBeNull();

      releaseDe(german);
      expect(await deRequest).toBe(german);

      expect(await ensureUppyLocale("en")).toBeNull();
      expect(deLoadCount).toBe(1);
      // English stayed settled; a fresh German request must load again.
      expect(await ensureUppyLocale("de")).toBe(german);
      expect(deLoadCount).toBe(2);
    });

    it("does not permanently cache a failed pack load as settled English", async () => {
      let attempts = 0;

      setUppyLocaleLoaderForTests(async () => {
        attempts += 1;

        if (attempts === 1) {
          throw new Error("pack missing");
        }

        return german;
      });

      expect(await ensureUppyLocale("de")).toBeNull();
      expect(await ensureUppyLocale("de")).toBe(german);
      expect(attempts).toBe(2);
    });

    it("does not let a settled-cache hit block a newer in-flight language from settling", async () => {
      let releaseFr!: (locale: UppyLocale) => void;
      const frGate = new Promise<UppyLocale>((resolve) => {
        releaseFr = resolve;
      });
      let frLoadCount = 0;

      setUppyLocaleLoaderForTests(async (localeId) => {
        if (localeId === "de_DE") {
          return german;
        }

        if (localeId === "fr_FR") {
          frLoadCount += 1;

          return frGate;
        }

        return null;
      });

      expect(await ensureUppyLocale("de")).toBe(german);

      const frRequest = ensureUppyLocale("fr");

      // Settled German hit must not rewind latestRequestedKey away from French.
      expect(await ensureUppyLocale("de")).toBe(german);

      releaseFr(french);
      expect(await frRequest).toBe(french);
      expect(await ensureUppyLocale("fr")).toBe(french);
      expect(frLoadCount).toBe(1);
    });
  });
});
