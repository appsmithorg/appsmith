import MetaWidgetGenerator from "../MetaWidgetGenerator";
import type { MetaWidgetRowCache } from "../types";
import { isEqual } from "lodash";

// Mock required dependencies
jest.mock("@tanstack/virtual-core", () => ({
  elementScroll: jest.fn(),
  observeElementOffset: jest.fn(),
  observeElementRect: jest.fn(),
  Virtualizer: jest.fn(),
}));

jest.mock("lodash", () => ({
  ...jest.requireActual("lodash"),
  isEqual: jest.fn(),
}));

jest.mock("utils/helpers", () => ({
  ...jest.requireActual("utils/helpers"),
  klonaRegularWithTelemetry: jest.fn((data) => data),
}));

describe("MetaWidgetGenerator", () => {
  let generator: MetaWidgetGenerator;

  beforeEach(() => {
    generator = new MetaWidgetGenerator({
      getWidgetCache: () => ({}),
      getWidgetReferenceCache: () => ({}),
      infiniteScroll: false,
      isListCloned: false,
      level: 1,
      onVirtualListScroll: () => {},
      prefixMetaWidgetId: "test",
      primaryWidgetType: "LIST_WIDGET_V2",
      renderMode: "CANVAS",
      setWidgetCache: () => {},
      setWidgetReferenceCache: () => {},
    });
    (isEqual as jest.Mock).mockImplementation((a, b) => a === b);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("hasRowDataChanged", () => {
    it("should return true when no cached data exists", () => {
      const generator = new MetaWidgetGenerator({
        getWidgetCache: () => ({}),
        getWidgetReferenceCache: () => ({}),
        infiniteScroll: false,
        isListCloned: false,
        level: 1,
        onVirtualListScroll: () => {},
        prefixMetaWidgetId: "test",
        primaryWidgetType: "LIST_WIDGET_V2",
        renderMode: "CANVAS",
        setWidgetCache: () => {},
        setWidgetReferenceCache: () => {},
      });

      // @ts-expect-error: Testing private method
      const result = generator.hasRowDataChanged("test-key", "test-widget");
      expect(result).toBe(true);
    });

    it("should return true when data has changed", () => {
      const generator = new MetaWidgetGenerator({
        getWidgetCache: () => ({}),
        getWidgetReferenceCache: () => ({}),
        infiniteScroll: false,
        isListCloned: false,
        level: 1,
        onVirtualListScroll: () => {},
        prefixMetaWidgetId: "test",
        primaryWidgetType: "LIST_WIDGET_V2",
        renderMode: "CANVAS",
        setWidgetCache: () => {},
        setWidgetReferenceCache: () => {},
      });

      Object.defineProperty(generator, "rowDataCache", {
        value: {
          "test-key": {
            data: { value: "old" },
            lastUpdated: Date.now(),
          },
        },
        writable: true,
      });

      Object.defineProperty(generator, "cachedKeyDataMap", {
        value: {
          "test-key": { value: "new" },
        },
        writable: true,
      });

      // @ts-expect-error: Testing private method
      const result = generator.hasRowDataChanged("test-key", "test-widget");
      expect(result).toBe(true);
    });

    it("should return false when data has not changed", () => {
      const generator = new MetaWidgetGenerator({
        getWidgetCache: () => ({}),
        getWidgetReferenceCache: () => ({}),
        infiniteScroll: false,
        isListCloned: false,
        level: 1,
        onVirtualListScroll: () => {},
        prefixMetaWidgetId: "test",
        primaryWidgetType: "LIST_WIDGET_V2",
        renderMode: "CANVAS",
        setWidgetCache: () => {},
        setWidgetReferenceCache: () => {},
      });

      const testData = { value: "same" };

      Object.defineProperty(generator, "rowDataCache", {
        value: {
          "test-key": {
            data: testData,
            lastUpdated: Date.now(),
          },
        },
        writable: true,
      });

      Object.defineProperty(generator, "cachedKeyDataMap", {
        value: {
          "test-key": testData,
        },
        writable: true,
      });

      // @ts-expect-error: Testing private method
      const result = generator.hasRowDataChanged("test-key", "test-widget");
      expect(result).toBe(false);
    });
  });
});
