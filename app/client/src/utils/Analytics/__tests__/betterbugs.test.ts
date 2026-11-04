import BetterbugsUtil from "utils/Analytics/betterbugs";
import type { BetterbugsMetadata } from "utils/Analytics/betterbugs";

const mockBetterbugsConstructor = jest.fn();

jest.mock("@betterbugs/web-sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((options) => {
    mockBetterbugsConstructor(options);

    return {
      destroy: jest.fn(),
      openWidget: jest.fn(),
      getMetadata: jest.fn(() => ({})),
      setMetadata: jest.fn(),
    };
  }),
}));

jest.mock("ee/configs", () => {
  const actual = jest.requireActual("ee/configs");

  return {
    ...actual,
    getAppsmithConfigs: () => ({
      ...actual.getAppsmithConfigs(),
      betterbugs: { enabled: true, apiKey: "test-api-key" },
    }),
  };
});

jest.mock("ee/utils/airgapHelpers", () => ({
  ...jest.requireActual("ee/utils/airgapHelpers"),
  isAirgapped: () => false,
}));

const baseMetadata: BetterbugsMetadata = {
  instanceId: "instance-1",
  tenantId: "tenant-1",
  applicationId: "app-1",
  pageId: "page-1",
};

const getSentMetadata = () =>
  mockBetterbugsConstructor.mock.calls[0][0].metaData as Record<
    string,
    string | null
  >;

describe("BetterbugsUtil metadata", () => {
  beforeEach(() => {
    mockBetterbugsConstructor.mockClear();
    BetterbugsUtil.destroy();
  });

  it("sends null workflow, package and module ids when they are not provided", async () => {
    await BetterbugsUtil.init(undefined, baseMetadata);

    expect(getSentMetadata()).toMatchObject({
      application_id: "app-1",
      page_id: "page-1",
      workflow_id: null,
      package_id: null,
      module_id: null,
    });
  });

  it("sends workflow, package and module ids when they are provided", async () => {
    await BetterbugsUtil.init(undefined, {
      ...baseMetadata,
      applicationId: null,
      pageId: null,
      workflowId: "workflow-1",
      packageId: "package-1",
      moduleId: "module-1",
    });

    expect(getSentMetadata()).toMatchObject({
      application_id: null,
      page_id: null,
      workflow_id: "workflow-1",
      package_id: "package-1",
      module_id: "module-1",
    });
  });
});
