import transformCurlImport from "transformers/CurlImportTransformer";

describe("CurlImportTransformer", () => {
  it("has quotes in start and end and escapes special characters", () => {
    const inputs = [
      `curl -X GET`,
      `"curl -X GET`,
      `curl -X GET"`,
      `curl google.com\n`,
    ];
    const outputs = [
      `"curl -X GET"`,
      `"\\"curl -X GET"`,
      `"curl -X GET\\""`,
      `"curl google.com\\n"`,
    ];
    inputs.forEach((input, index) => {
      const result = transformCurlImport(input);
      expect(result).toBe(outputs[index]);
    });
  });
});
