import { extractFunctionParams } from "./utils";

describe("extractFunctionParams", () => {
  test("should extract parameter names from a function with parameters", () => {
    const functionString =
      "function exampleFunction(param1, param2, param3) {}";
    const result = extractFunctionParams(functionString);
    expect(result).toEqual(["param1", "param2", "param3"]);
  });

  test("should handle a function without parameters", () => {
    const functionString = "function exampleFunction() {}";
    const result = extractFunctionParams(functionString);
    expect(result).toEqual([]);
  });

  test("should handle default values and rest parameters", () => {
    const functionString =
      "function exampleFunction(param1, param2 = 42, ...restParams) {}";
    const result = extractFunctionParams(functionString);
    expect(result).toEqual(["param1", "param2", "...restParams"]);
  });

  test("should handle default values without affecting parameter names", () => {
    const functionString =
      'function exampleFunction(param1, param2 = "default", param3 = true) {}';
    const result = extractFunctionParams(functionString);
    expect(result).toEqual(["param1", "param2", "param3"]);
  });

  test("should handle complex default values and spacing", () => {
    const functionString =
      'function exampleFunction(param1, param2 = { key: "value" }, param3) {}';
    const result = extractFunctionParams(functionString);
    expect(result).toEqual(["param1", "param2", "param3"]);
  });
});
