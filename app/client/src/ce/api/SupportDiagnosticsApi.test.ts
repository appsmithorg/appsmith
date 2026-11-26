import Api from "api/Api";
import SupportDiagnosticsApi from "ee/api/SupportDiagnosticsApi";
import {
  isFailure,
  responseStatus,
} from "../pages/AdminSettings/SupportDiagnostics/types";

jest.mock("api/Api", () => {
  class MockApi {
    static get = jest.fn();
    static post = jest.fn();
  }

  return { __esModule: true, default: MockApi };
});

function ok<T>(data: T) {
  return { responseMeta: { status: 200, success: true }, data };
}

function failure(status: number) {
  return {
    responseMeta: { status, success: false, error: { code: "x", message: "" } },
    data: null,
  };
}

describe("SupportDiagnosticsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Api.get as jest.Mock).mockResolvedValue(ok({}));
    (Api.post as jest.Mock).mockResolvedValue(ok(null));
  });

  it("should_callSectionEndpoints_when_methodsInvoked", async () => {
    await SupportDiagnosticsApi.listSections();
    await SupportDiagnosticsApi.collectSection("AI_MCP");
    const body = { sectionIds: ["INSTANCE" as const], encrypted: true };

    await SupportDiagnosticsApi.recordDownload(body);

    expect(Api.get).toHaveBeenCalledWith(
      "v1/admin/support/diagnostics/sections",
    );
    expect(Api.post).toHaveBeenNthCalledWith(
      1,
      "v1/admin/support/diagnostics/sections/AI_MCP/collect",
    );
    expect(Api.post).toHaveBeenNthCalledWith(
      2,
      "v1/admin/support/diagnostics/downloads",
      body,
    );
  });

  it("should_treatResolvedFailureAsFailure", () => {
    expect(isFailure(failure(429))).toBe(true);
    expect(responseStatus(failure(429))).toBe(429);
    expect(isFailure(ok({}))).toBe(false);
    expect(isFailure(undefined)).toBe(true);
  });
});
