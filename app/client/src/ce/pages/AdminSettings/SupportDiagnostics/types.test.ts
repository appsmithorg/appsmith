import { normalizeSectionResult } from "./types";

describe("normalizeSectionResult", () => {
  it.each([
    ["epoch seconds", 1794924300.0, "2026-11-17T14:05:00.000Z"],
    ["epoch seconds with a fraction", 1794924300.5, "2026-11-17T14:05:00.500Z"],
    ["an ISO string", "2026-11-17T14:05:00Z", "2026-11-17T14:05:00.000Z"],
    ["missing", undefined, null],
    ["null", null, null],
    ["a garbage string", "not a date", null],
    ["an empty string", "", null],
    ["NaN", Number.NaN, null],
    ["Infinity", Number.POSITIVE_INFINITY, null],
    ["an object", { seconds: 1 }, null],
  ])(
    "should_normalizeCollectedAt_when_valueIs (%s)",
    (_label, collectedAt, expected) => {
      // Given
      const raw = { sectionId: "HEALTH", status: "OK", collectedAt };

      // When
      const result = normalizeSectionResult(raw);

      // Then
      expect(result.collectedAt).toBe(expected);
    },
  );

  it("should_setDataAndErrorCodeToNull_when_absent", () => {
    // Given
    const raw = { sectionId: "DATASOURCES", status: "NOT_SUPPORTED" };

    // When
    const result = normalizeSectionResult(raw);

    // Then
    expect(result).toEqual({
      sectionId: "DATASOURCES",
      status: "NOT_SUPPORTED",
      collectedAt: null,
      data: null,
      errorCode: null,
    });
  });

  it("should_keepDataAndErrorCode_when_present", () => {
    // Given
    const raw = {
      sectionId: "AI_MCP",
      status: "UNAVAILABLE",
      data: { a: 1 },
      errorCode: "timeout",
    };

    // When
    const result = normalizeSectionResult(raw);

    // Then
    expect(result.data).toEqual({ a: 1 });
    expect(result.errorCode).toBe("timeout");
  });
});
