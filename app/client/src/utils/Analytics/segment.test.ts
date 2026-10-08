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
      const result = await segment.init(true);

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
      const result = await segment.init(true);

      expect(result).toBe(true);
      expect(mockAnalyticsBrowser.load).not.toHaveBeenCalled();
    });

    it("should not initialize when shouldTrackUser is false", async () => {
      const segment = SegmentSingleton.getInstance();
      const result = await segment.init(false);

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
      const result = await segment.init(true);

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
      await segment.init(true);

      expect(mockAnalytics.track).toHaveBeenCalledWith("test-event", eventData);
    });

    it("should track events directly when initialized", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init(true);

      const eventData = { test: "data" };

      segment.track("test-event", eventData);

      expect(mockAnalytics.track).toHaveBeenCalledWith("test-event", eventData);
    });
  });

  describe("identify", () => {
    const userId = "test-user";
    const traits = { name: "Test User" };

    beforeEach(() => {
      window.sessionStorage.clear();
      // analytics.js reports the user it already knows from storage; by default nobody is known.
      mockAnalytics.user.mockReturnValue({ id: () => null });
    });

    it("should call analytics identify when initialized", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init(true);

      await segment.identify(userId, traits);

      expect(mockAnalytics.identify).toHaveBeenCalledWith(userId, traits);
    });

    it("should not repeat an identify for the same user and traits within a session", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init(true);

      await segment.identify(userId, traits);
      // After the first identify analytics.js knows the user, as it would on the next page load.
      mockAnalytics.user.mockReturnValue({ id: () => userId });
      await segment.identify(userId, traits);
      await segment.identify(userId, { ...traits });

      expect(mockAnalytics.identify).toHaveBeenCalledTimes(1);
    });

    it("should identify again when the traits change", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init(true);

      await segment.identify(userId, traits);
      mockAnalytics.user.mockReturnValue({ id: () => userId });
      await segment.identify(userId, { ...traits, version: "Appsmith EE 1.0" });

      expect(mockAnalytics.identify).toHaveBeenCalledTimes(2);
    });

    it("should identify again when a different user signs in", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init(true);

      await segment.identify(userId, traits);
      mockAnalytics.user.mockReturnValue({ id: () => userId });
      await segment.identify("another-user", traits);

      expect(mockAnalytics.identify).toHaveBeenCalledTimes(2);
      expect(mockAnalytics.identify).toHaveBeenLastCalledWith(
        "another-user",
        traits,
      );
    });

    it("should identify again when analytics.js no longer knows the user", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init(true);

      await segment.identify(userId, traits);
      // Session storage still remembers the identify, but analytics.js storage was cleared.
      mockAnalytics.user.mockReturnValue({ id: () => null });
      await segment.identify(userId, traits);

      expect(mockAnalytics.identify).toHaveBeenCalledTimes(2);
    });

    it("should share one in-flight call between concurrent identifies", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init(true);

      let resolveIdentify: () => void = () => undefined;

      mockAnalytics.identify.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveIdentify = resolve;
        }),
      );

      const first = segment.identify(userId, traits);
      const second = segment.identify(userId, traits);

      resolveIdentify();
      await Promise.all([first, second]);

      expect(mockAnalytics.identify).toHaveBeenCalledTimes(1);
    });

    it("should identify again after reset", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init(true);

      await segment.identify(userId, traits);
      mockAnalytics.user.mockReturnValue({ id: () => userId });
      segment.reset();
      await segment.identify(userId, traits);

      expect(mockAnalytics.identify).toHaveBeenCalledTimes(2);
    });

    it("should start a fresh identify after a reset that interrupted an in-flight one", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init(true);

      let resolveIdentify: () => void = () => undefined;

      mockAnalytics.identify.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveIdentify = resolve;
        }),
      );

      const stale = segment.identify(userId, traits);

      // Logout while the identify is still on the wire, then the same user logs in again.
      segment.reset();
      const fresh = segment.identify(userId, traits);

      resolveIdentify();
      await Promise.all([stale, fresh]);

      expect(mockAnalytics.identify).toHaveBeenCalledTimes(2);
    });

    it("should not let an identify interrupted by reset mark the new session as identified", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init(true);

      let resolveIdentify: () => void = () => undefined;

      mockAnalytics.identify.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveIdentify = resolve;
        }),
      );

      const stale = segment.identify(userId, traits);

      segment.reset();
      resolveIdentify();
      await stale;

      // analytics.js knows the user again; only a post-reset identify may skip the call.
      mockAnalytics.user.mockReturnValue({ id: () => userId });
      await segment.identify(userId, traits);

      expect(mockAnalytics.identify).toHaveBeenCalledTimes(2);
    });
  });

  describe("reset", () => {
    it("should call analytics reset when initialized", async () => {
      const segment = SegmentSingleton.getInstance();

      await segment.init(true);

      segment.reset();

      expect(mockAnalytics.reset).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle initialization failure", async () => {
      mockAnalyticsBrowser.load.mockRejectedValueOnce(new Error("Init failed"));

      const segment = SegmentSingleton.getInstance();
      const result = await segment.init(true);

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

      await segment.init(true);

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
      await segment.init(true);

      // Analytics track should not be called since we're avoiding tracking
      expect(mockAnalytics.track).not.toHaveBeenCalled();
    });
  });
});
