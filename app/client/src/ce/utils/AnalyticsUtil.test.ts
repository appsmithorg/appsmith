import type { User } from "constants/userConstants";
import { APP_MODE } from "entities/App";
import type * as AnalyticsUtilModule from "./AnalyticsUtil";

const mockSegment = {
  init: jest.fn().mockResolvedValue(true),
  track: jest.fn(),
  identify: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  getUser: jest.fn(),
  avoidTracking: jest.fn(),
};

jest.mock("utils/Analytics/segment", () => ({
  __esModule: true,
  default: { getInstance: () => mockSegment },
}));
jest.mock("utils/Analytics/mixpanel", () => ({
  __esModule: true,
  default: { getInstance: () => ({ init: jest.fn().mockResolvedValue(true) }) },
}));
jest.mock("utils/Analytics/smartlook", () => ({
  __esModule: true,
  default: {
    init: jest.fn().mockResolvedValue(undefined),
    identify: jest.fn(),
  },
}));
jest.mock("instrumentation", () => ({
  appsmithTelemetry: { identifyUser: jest.fn() },
}));
jest.mock("ee/configs", () => ({
  getAppsmithConfigs: () => ({
    appVersion: { edition: "Community", id: "test" },
    cloudHosting: true,
    segment: { enabled: true, apiKey: "test-key" },
  }),
}));

const builder = {
  username: "builder@example.com",
  email: "builder@example.com",
  isAnonymous: false,
} as User;

const sessionRecordingConfig = { enabled: false, mask: false };

// AnalyticsUtil keeps per-session state at module level, so every test gets a fresh copy.
function loadAnalyticsUtil(): typeof AnalyticsUtilModule {
  let analyticsUtil: typeof AnalyticsUtilModule | undefined;

  jest.isolateModules(() => {
    analyticsUtil =
      jest.requireActual<typeof AnalyticsUtilModule>("./AnalyticsUtil");
  });

  return analyticsUtil as typeof AnalyticsUtilModule;
}

describe("AnalyticsUtil.logEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not identify while initializing", async () => {
    const AnalyticsUtil = loadAnalyticsUtil();

    await AnalyticsUtil.initialize(builder, sessionRecordingConfig, true);

    expect(mockSegment.identify).not.toHaveBeenCalled();
  });

  it("never sends a blocked event to Segment", async () => {
    const AnalyticsUtil = loadAnalyticsUtil();

    AnalyticsUtil.setAppMode(APP_MODE.EDIT);
    await AnalyticsUtil.initialize(builder, sessionRecordingConfig, true);
    AnalyticsUtil.logEvent("PAGE_LOAD");

    expect(mockSegment.track).not.toHaveBeenCalled();
  });

  it("identifies once, on the first allowed event, before tracking it", async () => {
    const AnalyticsUtil = loadAnalyticsUtil();

    AnalyticsUtil.setAppMode(APP_MODE.EDIT);
    await AnalyticsUtil.initialize(builder, sessionRecordingConfig, true);
    AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE");

    expect(mockSegment.identify).toHaveBeenCalledTimes(1);
    expect(mockSegment.identify).toHaveBeenCalledWith(
      builder.username,
      expect.objectContaining({ email: builder.email }),
    );
    expect(mockSegment.track).toHaveBeenCalledTimes(1);
    expect(mockSegment.track).toHaveBeenCalledWith(
      "WIDGET_PROPERTY_UPDATE",
      expect.any(Object),
    );
    expect(mockSegment.identify.mock.invocationCallOrder[0]).toBeLessThan(
      mockSegment.track.mock.invocationCallOrder[0],
    );

    AnalyticsUtil.logEvent("CREATE_APP");

    expect(mockSegment.identify).toHaveBeenCalledTimes(1);
    expect(mockSegment.track).toHaveBeenCalledTimes(2);
  });

  it("identifies nobody when every event in the session is blocked", async () => {
    const AnalyticsUtil = loadAnalyticsUtil();

    AnalyticsUtil.setAppMode(APP_MODE.PUBLISHED);
    await AnalyticsUtil.initialize(builder, sessionRecordingConfig, true);
    AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE");
    AnalyticsUtil.logEvent("APP_VIEWED_WITH_NAVBAR");

    expect(mockSegment.identify).not.toHaveBeenCalled();
    expect(mockSegment.track).not.toHaveBeenCalled();
  });

  it("identifies an allowed event that arrived while Segment was still loading once loading ends", async () => {
    const AnalyticsUtil = loadAnalyticsUtil();
    let finishSegmentInit: (value: boolean) => void = () => {};

    mockSegment.init.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        finishSegmentInit = resolve;
      }),
    );

    AnalyticsUtil.setAppMode(APP_MODE.EDIT);
    const initializing = AnalyticsUtil.initialize(
      builder,
      sessionRecordingConfig,
      true,
    );

    await Promise.resolve();
    AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE");

    expect(mockSegment.track).toHaveBeenCalledTimes(1);
    expect(mockSegment.identify).not.toHaveBeenCalled();

    finishSegmentInit(true);
    await initializing;

    expect(mockSegment.identify).toHaveBeenCalledTimes(1);
  });

  it("drops events for an anonymous user", async () => {
    const AnalyticsUtil = loadAnalyticsUtil();

    AnalyticsUtil.setAppMode(APP_MODE.EDIT);
    await AnalyticsUtil.initialize(
      { ...builder, username: "anonymousUser", isAnonymous: true },
      sessionRecordingConfig,
      false,
    );
    AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE");

    expect(mockSegment.track).not.toHaveBeenCalled();
    expect(mockSegment.identify).not.toHaveBeenCalled();
  });

  it("identifies again after reset when the next user signs in", async () => {
    const AnalyticsUtil = loadAnalyticsUtil();

    AnalyticsUtil.setAppMode(APP_MODE.EDIT);
    await AnalyticsUtil.initialize(builder, sessionRecordingConfig, true);
    AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE");
    AnalyticsUtil.reset();
    AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE");

    expect(mockSegment.identify).toHaveBeenCalledTimes(1);
    expect(mockSegment.track).toHaveBeenCalledTimes(1);

    await AnalyticsUtil.initialize(builder, sessionRecordingConfig, true);
    AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE");

    expect(mockSegment.identify).toHaveBeenCalledTimes(2);
  });
});
