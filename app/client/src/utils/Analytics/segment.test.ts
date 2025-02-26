import SegmentSingleton from "./segment";
import { getAppsmithConfigs } from "ee/configs";
import log from "loglevel";

// Mock external dependencies
jest.mock("ee/configs");
jest.mock("loglevel");
jest.mock("@segment/analytics-next", () => ({
  AnalyticsBrowser: {
    load: jest.fn(),
  },
}));

// Mock implementations
const mockAnalytics = {
  track: jest.fn(),
  identify: jest.fn(),
  addSourceMiddleware: jest.fn(),
  reset: jest.fn(),
  user: jest.fn(),
};

const mockAnalyticsBrowser = {
  load: jest.fn().mockResolvedValue([mockAnalytics]),
};

// Setup before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Reset singleton instance
  (SegmentSingleton as unknown as { instance: unknown }).instance = undefined;

  // Default mock for getAppsmithConfigs
  (getAppsmithConfigs as jest.Mock).mockReturnValue({
    segment: {
      enabled: true,
      apiKey: "test-api-key",
      ceKey: "test-ce-key",
    },
  });

  // Set up AnalyticsBrowser mock
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("@segment/analytics-next").AnalyticsBrowser = mockAnalyticsBrowser;
});

describe("SegmentSingleton", () => {
  describe("getInstance", () => {
    it("should return the same instance when called multiple times", () => {
      const instance1 = SegmentSingleton.getInstance();
      const instance2 = SegmentSingleton.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("init", () => {
    it("should initialize successfully with API key", async () => {
      const segment = SegmentSingleton.getInstance();
      const result = await segment.init();

      expect(result).toBe(true);
      expect(mockAnalyticsBrowser.load).toHaveBeenCalledWith(
        { writeKey: "test-api-key" },
        expect.any(Object),
      );
    });

    it("should not initialize when segment is disabled", async () => {
      (getAppsmithConfigs as jest.Mock).mockReturnValue({
        segment: { enabled: false },
      });

      const segment = SegmentSingleton.getInstance();
      const result = await segment.init();

      expect(result).toBe(true);
      expect(mockAnalyticsBrowser.load).not.toHaveBeenCalled();
    });

    it("should use ceKey when apiKey is not available", async () => {
      (getAppsmithConfigs as jest.Mock).mockReturnValue({
        segment: {
          enabled: true,
          apiKey: "",
          ceKey: "test-ce-key",
        },
      });

      const segment = SegmentSingleton.getInstance();
      const result = await segment.init();

      expect(result).toBe(true);
      expect(mockAnalyticsBrowser.load).toHaveBeenCalledWith(
        { writeKey: "test-ce-key" },
        expect.any(Object),
      );
    });
  });

  describe("track", () => {
    it("should queue events when not initialized", () => {
      const segment = SegmentSingleton.getInstance();
      const eventData = { test: "data" };

      segment.track("test-event", eventData);

      expect(mockAnalytics.track).not.toHaveBeenCalled();
      expect(log.debug).toHaveBeenCalledWith(
        "Event queued for later processing",
        "test-event",
        eventData,
      );
    });

    it("should process queued events after initialization", async () => {
      const segment = SegmentSingleton.getInstance();
      const eventData = { test: "data" };

      segment.track("test-event", eventData);
      await segment.init();

      expect(mockAnalytics.track).toHaveBeenCalledWith("test-event", eventData);
    });

    it("should track events directly when initialized", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init();

      const eventData = { test: "data" };

      segment.track("test-event", eventData);

      expect(mockAnalytics.track).toHaveBeenCalledWith("test-event", eventData);
    });
  });

  describe("identify", () => {
    it("should call analytics identify when initialized", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init();

      const userId = "test-user";
      const traits = { name: "Test User" };

      await segment.identify(userId, traits);

      expect(mockAnalytics.identify).toHaveBeenCalledWith(userId, traits);
    });
  });

  describe("reset", () => {
    it("should call analytics reset when initialized", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init();

      segment.reset();

      expect(mockAnalytics.reset).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle initialization failure", async () => {
      mockAnalyticsBrowser.load.mockRejectedValueOnce(new Error("Init failed"));

      const segment = SegmentSingleton.getInstance();
      const result = await segment.init();

      expect(result).toBe(false);
      expect(log.error).toHaveBeenCalledWith(
        "Failed to initialize Segment:",
        expect.any(Error),
      );
    });
  });
  describe("avoidTracking", () => {
    it("should not track events after avoidTracking is called", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init();

      // Track an event before calling avoidTracking
      segment.track("pre-avoid-event", { data: "value" });
      expect(mockAnalytics.track).toHaveBeenCalledTimes(1);

      // Call avoidTracking
      segment.avoidTracking();

      // Track an event after calling avoidTracking
      segment.track("post-avoid-event", { data: "value" });

      // Should still have only been called once (from the first event)
      expect(mockAnalytics.track).toHaveBeenCalledTimes(1);
      expect(log.debug).toHaveBeenCalledWith(
        expect.stringContaining("Event fired locally"),
        "post-avoid-event",
        { data: "value" },
      );
    });

    it("should flush queued events when avoidTracking is called before initialization", async () => {
      const segment = SegmentSingleton.getInstance();

      // Queue some events
      segment.track("queued-event-1", { data: "value1" });
      segment.track("queued-event-2", { data: "value2" });

      // Call avoidTracking before initialization
      segment.avoidTracking();

      // Initialize
      await segment.init();

      // Analytics track should not be called since we're avoiding tracking
      expect(mockAnalytics.track).not.toHaveBeenCalled();
    });
  });
});
