import { formatValue, labelFor, RAW_KEY_MAPS } from "./formatValue";

describe("formatValue", () => {
  it("should_labelKeys", () => {
    expect(labelFor("aiAssistantCustomBaseUrl")).toBe(
      "AI assistant custom base URL",
    );
    expect(labelFor("mcpUnrevokedKeys")).toBe("MCP unrevoked keys");
    expect(labelFor("osArch")).toBe("OS architecture");
    expect(labelFor("instanceId")).toBe("Instance ID");
    expect(labelFor("LICENSE_TIER")).toBe("LICENSE_TIER");
  });

  it("should_labelKey_when_keyMatchesAnObjectPrototypeMember", () => {
    expect(labelFor("constructor")).toBe("Constructor");
    expect(labelFor("toString")).toBe("To string");
  });

  it("should_notTreatSectionIdAsRawMap", () => {
    expect(RAW_KEY_MAPS.has("FEATURE_FLAGS")).toBe(false);
  });

  it("should_formatScalars", () => {
    expect(formatValue(true)).toEqual({ kind: "text", text: "Yes" });
    expect(formatValue(false)).toEqual({ kind: "text", text: "No" });
    expect(formatValue(1234)).toEqual({ kind: "text", text: "1,234" });
    expect(formatValue("UNKNOWN")).toEqual({ kind: "text", text: "Unknown" });
    expect(formatValue("NOT_SUPPORTED")).toEqual({
      kind: "text",
      text: "Not supported",
    });
    expect(formatValue("other")).toEqual({ kind: "text", text: "Other" });
    expect(formatValue("linux")).toEqual({ kind: "text", text: "linux" });
    expect(formatValue(null)).toEqual({ kind: "text", text: "Unknown" });
  });

  it("should_formatDeploymentField", () => {
    expect(
      formatValue({
        value: "docker",
        source: "application_config",
        confidence: "detected",
        availability: "available",
      }),
    ).toEqual({ kind: "text", text: "docker (detected)" });
    expect(
      formatValue({
        value: "UNKNOWN",
        source: "application_config",
        confidence: "unknown",
        availability: "unavailable",
      }),
    ).toEqual({ kind: "text", text: "Unknown (unknown)" });
  });

  it("should_formatMaps", () => {
    expect(formatValue({ form: true, google: false })).toEqual({
      kind: "list",
      entries: [
        ["Form", { kind: "text", text: "Yes" }],
        ["Google", { kind: "text", text: "No" }],
      ],
    });
    expect(formatValue({ release_workflows_enabled: true }, true)).toEqual({
      kind: "list",
      entries: [["release_workflows_enabled", { kind: "text", text: "Yes" }]],
    });
    expect(formatValue({})).toEqual({ kind: "text", text: "None" });
    expect(formatValue(["a", "b"])).toEqual({
      kind: "list",
      entries: [
        ["1", { kind: "text", text: "a" }],
        ["2", { kind: "text", text: "b" }],
      ],
    });
  });

  it("should_keepNestedIdentifierKeys_when_keyIsRawMap", () => {
    expect(RAW_KEY_MAPS.has("flags")).toBe(true);
    expect(formatValue({ flags: { some_flag_name: true } })).toEqual({
      kind: "list",
      entries: [
        [
          "Flags",
          {
            kind: "list",
            entries: [["some_flag_name", { kind: "text", text: "Yes" }]],
          },
        ],
      ],
    });
  });
});
