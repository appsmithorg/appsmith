import { objectKeys } from "@appsmith/utils";
import {
  buildReport,
  instanceBrowserFields,
  MAX_REPORT_BYTES,
  ReportTooLargeError,
  reportFileName,
  sha256Hex,
} from "./buildReport";
import type { ReportInput } from "./buildReport";
import { SECTION_FILE_NAMES, SECTION_IDS } from "./types";
import type { SectionId, SectionResult, SectionStatus } from "./types";

const NOW = new Date("2026-11-22T15:00:00.000Z");
const ORIGIN = "https://b.example.com";

// Content-sensitive, so a hash of the wrong file or a stale text is caught.
const fakeHasher = async (text: string) => `hash:${text}`;

function ok(
  sectionId: SectionId,
  data: Record<string, unknown>,
): SectionResult {
  return {
    sectionId,
    status: "OK",
    collectedAt: "2026-11-22T14:59:00.000Z",
    data,
    errorCode: null,
  };
}

function allSections(): SectionResult[] {
  return [
    ok("INSTANCE", {
      edition: "EE",
      version: "1.80.0",
      instanceId: "abc",
      configuredPublicUrl: "https://a.example.com",
    }),
    ok("DEPLOYMENT", {
      tool: {
        value: "helm",
        source: "env",
        confidence: "declared",
        availability: "AVAILABLE",
      },
      cpuCount: {
        value: 4,
        source: "jvm",
        confidence: null,
        availability: null,
      },
    }),
    ok("FEATURE_FLAGS", { flags: { a: true } }),
    ok("APPLICATIONS", { count: 3 }),
    ok("DATASOURCES", { plugins: ["zzseed-unchecked"] }),
    ok("WORKFLOWS", { count: 1 }),
    {
      sectionId: "IDENTITY",
      status: "NOT_LICENSED",
      collectedAt: null,
      data: null,
      errorCode: null,
    },
    ok("AI_MCP", { enabled: false }),
    ok("HEALTH", { mongo: "UP" }),
  ];
}

function input(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    sections: allSections(),
    selected: [...SECTION_IDS],
    collectorVersion: "1.2.3",
    origin: ORIGIN,
    now: NOW,
    ...overrides,
  };
}

function parse(text: string): Record<string, unknown> {
  return JSON.parse(text) as Record<string, unknown>;
}

describe("buildReport", () => {
  it("should_includeOnlySelectedSections", async () => {
    // Given
    const selected: SectionId[] = ["INSTANCE", "HEALTH"];

    // When
    const { files } = await buildReport(input({ selected }), fakeHasher);

    // Then
    expect(objectKeys(files).sort()).toEqual(
      ["health.json", "instance.json", "manifest.json", "summary.json"].sort(),
    );

    const manifest = parse(files["manifest.json"]);

    expect(manifest.selectedSectionIds).toEqual(["INSTANCE", "HEALTH"]);
    expect(manifest.excludedSectionIds).toEqual([
      "DEPLOYMENT",
      "FEATURE_FLAGS",
      "APPLICATIONS",
      "DATASOURCES",
      "WORKFLOWS",
      "IDENTITY",
      "AI_MCP",
    ]);

    for (const text of Object.values(files)) {
      expect(text).not.toContain("zzseed-unchecked");
      expect(text).not.toContain("NOT_LICENSED");
    }

    expect(manifest.sectionStatus).toEqual({ INSTANCE: "OK", HEALTH: "OK" });
    expect(parse(files["summary.json"]).sectionStatus).toEqual({
      INSTANCE: "OK",
      HEALTH: "OK",
    });
  });

  it.each<[SectionStatus, string | null]>([
    ["UNAVAILABLE", "timeout"],
    ["UNKNOWN", "license_unknown"],
    ["NOT_COLLECTED", null],
    ["NOT_SUPPORTED", null],
    ["NOT_LICENSED", null],
  ])(
    "should_writeStatusRecord_when_selectedSectionNotUsable (%s, %s)",
    async (status, errorCode) => {
      // Given
      const sections = allSections().map((section) =>
        section.sectionId === "WORKFLOWS"
          ? {
              ...section,
              status,
              errorCode,
              data: { leaked: "zzseed-not-ok" },
            }
          : section,
      );

      // When
      const { files } = await buildReport(
        input({ sections, selected: ["WORKFLOWS"] }),
        fakeHasher,
      );

      // Then
      const record = parse(files["workflows.json"]);

      expect(record).toEqual({ sectionId: "WORKFLOWS", status, errorCode });
      expect(record).not.toHaveProperty("data");
      expect(files["workflows.json"]).not.toContain("zzseed-not-ok");
    },
  );

  it("should_copyServerDataUnchanged_when_sectionOk", async () => {
    // Given
    const sections = allSections();

    // When
    const { files } = await buildReport(input({ sections }), fakeHasher);

    // Then
    for (const section of sections) {
      if (section.status !== "OK") continue;

      const file = parse(files[SECTION_FILE_NAMES[section.sectionId]]);
      const fileData = file.data as Record<string, unknown>;

      expect(objectKeys(file).sort()).toEqual(
        ["collectedAt", "data", "sectionId", "status"].sort(),
      );
      expect(file.sectionId).toBe(section.sectionId);
      expect(file.status).toBe("OK");
      expect(file.collectedAt).toBe(section.collectedAt);

      if (section.sectionId === "INSTANCE") {
        expect(objectKeys(fileData).sort()).toEqual(
          [
            ...objectKeys(section.data ?? {}),
            "instanceUrl",
            "publicUrlMismatch",
          ].sort(),
        );
        expect(fileData.instanceUrl).toBe(ORIGIN);
        // configuredPublicUrl is https://a.example.com, origin is b.example.com.
        expect(fileData.publicUrlMismatch).toBe(true);
      } else {
        expect(fileData).toEqual(section.data);
      }
    }
  });

  it("should_computeBrowserFields", () => {
    // Given
    const mismatched = { configuredPublicUrl: "https://a.example.com" };
    const matched = { configuredPublicUrl: ORIGIN };
    const unknown = { configuredPublicUrl: "UNKNOWN" };

    // When
    const mismatchedFields = instanceBrowserFields(mismatched, ORIGIN);
    const matchedFields = instanceBrowserFields(matched, ORIGIN);
    const unknownFields = instanceBrowserFields(unknown, ORIGIN);

    // Then
    expect(mismatchedFields).toEqual({
      instanceUrl: ORIGIN,
      publicUrlMismatch: true,
    });
    expect(matchedFields).toEqual({
      instanceUrl: ORIGIN,
      publicUrlMismatch: false,
    });
    expect(unknownFields).toEqual({
      instanceUrl: ORIGIN,
      publicUrlMismatch: "UNKNOWN",
    });
    expect(instanceBrowserFields(null, ORIGIN).publicUrlMismatch).toBe(
      "UNKNOWN",
    );
  });

  it("should_hashEveryFileExceptManifest", async () => {
    // Given
    const selected: SectionId[] = ["INSTANCE", "DEPLOYMENT", "IDENTITY"];

    // When
    const { files } = await buildReport(input({ selected }), fakeHasher);

    // Then
    const sha256 = parse(files["manifest.json"]).sha256 as Record<
      string,
      string
    >;
    const otherFiles = objectKeys(files).filter(
      (name) => name !== "manifest.json",
    );

    expect(objectKeys(sha256).sort()).toEqual(otherFiles.sort());

    expect(otherFiles).toHaveLength(4);

    for (const name of otherFiles) {
      expect(sha256[name]).toBe(await fakeHasher(files[name]));
    }

    expect(new Set(Object.values(sha256)).size).toBe(otherFiles.length);
  });

  it("should_hashWithSha256_when_defaultHasher", async () => {
    // When
    const ascii = await sha256Hex("abc");
    const multibyte = await sha256Hex("é");

    // Then
    expect(ascii).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    // Node: crypto.createHash("sha256").update("é", "utf8").digest("hex")
    expect(multibyte).toBe(
      "4a99557e4033c3539de2eb65472017cad5f9557f7a0625a09f1c3f6e2ba69c4c",
    );
  });

  it("should_writeNullErrorCode_when_errorCodeUndefined", async () => {
    // Given: a server result that left out `errorCode`.
    const sections = allSections().map((section) =>
      section.sectionId === "DATASOURCES"
        ? ({
            sectionId: "DATASOURCES",
            status: "UNAVAILABLE",
            collectedAt: null,
            data: null,
            errorCode: undefined,
          } as unknown as SectionResult)
        : section,
    );

    // When
    const { files } = await buildReport(
      input({ sections, selected: ["DATASOURCES"] }),
      fakeHasher,
    );

    // Then
    expect(parse(files["datasources.json"])).toEqual({
      sectionId: "DATASOURCES",
      status: "UNAVAILABLE",
      errorCode: null,
    });
  });

  it("should_writeNotCollectedRecord_when_selectedSectionMissing", async () => {
    // Given
    const sections = allSections().filter(
      (section) => section.sectionId !== "AI_MCP",
    );

    // When
    const { files } = await buildReport(
      input({ sections, selected: ["AI_MCP"] }),
      fakeHasher,
    );

    // Then
    expect(parse(files["ai-mcp.json"])).toEqual({
      sectionId: "AI_MCP",
      status: "NOT_COLLECTED",
      errorCode: null,
    });
    expect(parse(files["manifest.json"]).sectionStatus).toEqual({
      AI_MCP: "NOT_COLLECTED",
    });
  });

  it("should_buildManifestAndSummary", async () => {
    // When
    const withInstance = await buildReport(input(), fakeHasher);
    const withoutInstance = await buildReport(
      input({ selected: ["HEALTH"] }),
      fakeHasher,
    );

    // Then
    const manifest = parse(withInstance.files["manifest.json"]);
    const summary = parse(withInstance.files["summary.json"]);

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.generatedAt).toBe("2026-11-22T15:00:00.000Z");
    expect(manifest.edition).toBe("EE");
    expect(manifest.appVersion).toBe("1.80.0");
    expect(manifest.collectorVersion).toBe("1.2.3");
    expect(summary.edition).toBe("EE");
    expect(summary.appVersion).toBe("1.80.0");
    expect(summary.deploymentTool).toBe("helm");
    expect(withInstance.files["manifest.json"]).toBe(
      JSON.stringify(manifest, null, 2),
    );

    const bareManifest = parse(withoutInstance.files["manifest.json"]);
    const bareSummary = parse(withoutInstance.files["summary.json"]);

    expect(bareManifest.edition).toBe("UNKNOWN");
    expect(bareManifest.appVersion).toBe("UNKNOWN");
    expect(bareSummary.edition).toBe("UNKNOWN");
    expect(bareSummary.appVersion).toBe("UNKNOWN");
    expect(bareSummary.deploymentTool).toBe("UNKNOWN");
  });

  it("should_refuseReport_when_overOneMegabyteOfUtf8", async () => {
    // Given
    const big = allSections().map((section) =>
      section.sectionId === "HEALTH"
        ? { ...section, data: { blob: "é".repeat(600_000) } }
        : section,
    );
    const nearCap = allSections().map((section) =>
      section.sectionId === "HEALTH"
        ? { ...section, data: { blob: "a".repeat(MAX_REPORT_BYTES - 4_000) } }
        : section,
    );

    // When / Then
    // The default hasher keeps manifest hashes at real (64-char) size here.
    await expect(
      buildReport(input({ sections: big, selected: ["HEALTH"] })),
    ).rejects.toBeInstanceOf(ReportTooLargeError);

    const built = await buildReport(
      input({ sections: nearCap, selected: ["HEALTH"] }),
    );

    expect(built.totalBytes).toBeLessThanOrEqual(MAX_REPORT_BYTES);
    expect(built.totalBytes).toBeGreaterThan(MAX_REPORT_BYTES - 4_000);
  });
});

describe("reportFileName", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should_nameFileByUtcDate", () => {
    // Given
    jest.spyOn(Date.prototype, "getDate").mockReturnValue(28);
    jest.spyOn(Date.prototype, "getMonth").mockReturnValue(10);
    jest.spyOn(Date.prototype, "getFullYear").mockReturnValue(1999);
    const now = new Date(Date.UTC(2026, 0, 5, 23, 30));

    // When / Then
    expect(reportFileName(now, false)).toBe(
      "appsmith-support-diagnostics-20260105.zip",
    );
    expect(reportFileName(now, true)).toBe(
      "appsmith-support-diagnostics-encrypted-20260105.zip",
    );
  });
});
