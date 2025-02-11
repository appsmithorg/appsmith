import { validateApiPath } from "./validateApiPath";

describe("validateApiPath", () => {
  it("should return the path if it starts with 'https://'", () => {
    const validPath = "https://example.com";

    expect(validateApiPath(validPath)).toBe(validPath);
  });

  it("should throw an error if the path does not start with 'https://'", () => {
    const invalidPath = "example.com";

    expect(() => validateApiPath(invalidPath)).toThrow(
      "The example.com path must start with 'https://'.",
    );
  });
});
