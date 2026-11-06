import {
  ENGLISH_X_FILES_SELECTED,
  formatXFilesSelected,
  getDashboardLocaleOption,
  isEnglishHtmlLang,
  resetUppyLocaleCache,
  resolveUppyLocaleId,
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
    });

    it("maps BCP 47 region tags to Uppy ids", () => {
      expect(resolveUppyLocaleId("de-DE")).toBe("de_DE");
      expect(resolveUppyLocaleId("zh-TW")).toBe("zh_TW");
      expect(resolveUppyLocaleId("pt-PT")).toBe("pt_PT");
      expect(resolveUppyLocaleId("sr-RS-Latin")).toBe("sr_RS_Latin");
    });

    it("falls back to the preferred pack for unknown regions of a known language", () => {
      expect(resolveUppyLocaleId("de-AT")).toBe("de_DE");
      expect(resolveUppyLocaleId("fr-CA")).toBe("fr_FR");
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

    it("does not override closeModal when a non-English pack is active", () => {
      const german: UppyLocale = {
        strings: { closeModal: "Modal schließen" },
        pluralize: (n) => (n === 1 ? 0 : 1),
      };

      expect(getDashboardLocaleOption("de", german)).toEqual({});
    });
  });
});
