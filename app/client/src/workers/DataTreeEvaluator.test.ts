import DataTreeEvaluator from "./DataTreeEvaluator";

describe("DataTreeEvaluator", () => {
  let dataTreeEvaluator: DataTreeEvaluator;
  beforeAll(() => {
    dataTreeEvaluator = new DataTreeEvaluator({});
  });
  describe("evaluateActionBindings", () => {
    it("handles this.params.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(function() { return this.params.property })()",
          "(() => { return this.params.property })()",
          'this.params.property || "1=1"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual(["my value", "my value", "my value"]);
    });

    it("handles this?.params.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(() => { return this?.params.property })()",
          "(function() { return this?.params.property })()",
          'this?.params.property || "1=1"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual(["my value", "my value", "my value"]);
    });

    it("handles this?.params?.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(() => { return this?.params?.property })()",
          "(function() { return this?.params?.property })()",
          'this?.params?.property || "1=1"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual(["my value", "my value", "my value"]);
    });

    it("handles executionParams.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(function() { return executionParams.property })()",
          "(() => { return executionParams.property })()",
          'executionParams.property || "1=1"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual(["my value", "my value", "my value"]);
    });

    it("handles executionParams?.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(function() { return executionParams?.property })()",
          "(() => { return executionParams?.property })()",
          'executionParams?.property || "1=1"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual(["my value", "my value", "my value"]);
    });
  });
});
