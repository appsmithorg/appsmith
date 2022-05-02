import DataTreeEvaluator from "../DataTreeEvaluator";
import { unEvalTree } from "./mockUnEvalTree";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { DataTreeDiff } from "workers/evaluationUtils";
import { ALL_WIDGETS_AND_CONFIG } from "utils/WidgetRegistry";

const widgetConfigMap = {};
ALL_WIDGETS_AND_CONFIG.map(([, config]) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: No types available
  if (config.type && config.properties) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: No types available
    widgetConfigMap[config.type] = {
      // @ts-expect-error: config.properties type mismatch
      defaultProperties: config.properties.default,
      // @ts-expect-error: config.properties type mismatch
      derivedProperties: config.properties.derived,
      // @ts-expect-error: config.properties type mismatch
      metaProperties: config.properties.meta,
    };
  }
});

const dataTreeEvaluator = new DataTreeEvaluator(widgetConfigMap);

describe("DataTreeEvaluator", () => {
  describe("evaluateActionBindings", () => {
    it("handles this.params.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(function() { return this.params.property })()",
          "(() => { return this.params.property })()",
          'this.params.property || "default value"',
          'this.params.property1 || "default value"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual([
        "my value",
        "my value",
        "my value",
        "default value",
      ]);
    });

    it("handles this?.params.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(() => { return this?.params.property })()",
          "(function() { return this?.params.property })()",
          'this?.params.property || "default value"',
          'this?.params.property1 || "default value"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual([
        "my value",
        "my value",
        "my value",
        "default value",
      ]);
    });

    it("handles this?.params?.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(() => { return this?.params?.property })()",
          "(function() { return this?.params?.property })()",
          'this?.params?.property || "default value"',
          'this?.params?.property1 || "default value"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual([
        "my value",
        "my value",
        "my value",
        "default value",
      ]);
    });

    it("handles executionParams.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(function() { return executionParams.property })()",
          "(() => { return executionParams.property })()",
          'executionParams.property || "default value"',
          'executionParams.property1 || "default value"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual([
        "my value",
        "my value",
        "my value",
        "default value",
      ]);
    });

    it("handles executionParams?.property", () => {
      const result = dataTreeEvaluator.evaluateActionBindings(
        [
          "(function() { return executionParams?.property })()",
          "(() => { return executionParams?.property })()",
          'executionParams?.property || "default value"',
          'executionParams?.property1 || "default value"',
        ],
        {
          property: "my value",
        },
      );
      expect(result).toStrictEqual([
        "my value",
        "my value",
        "my value",
        "default value",
      ]);
    });
  });

  describe("test updateDependencyMap", () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      dataTreeEvaluator.createFirstTree(unEvalTree as DataTree);
    });

    it("initial dependencyMap computation", () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      dataTreeEvaluator.updateDataTree(unEvalTree as DataTree);

      expect(dataTreeEvaluator.dependencyMap).toStrictEqual({
        "Button2.text": ["Button1.text"],
        Button2: ["Button2.text"],
        Button1: ["Button1.text"],
      });
    });

    it(`When empty binding is modified from {{Button1.text}} to {{""}}`, () => {
      const translatedDiffs = [
        {
          payload: {
            propertyPath: "Button2.text",
            value: '{{""}}',
          },
          event: "EDIT",
        },
      ];
      dataTreeEvaluator.updateDependencyMap(
        translatedDiffs as Array<DataTreeDiff>,
        dataTreeEvaluator.oldUnEvalTree,
      );

      expect(dataTreeEvaluator.dependencyMap).toStrictEqual({
        "Button2.text": [],
        Button2: ["Button2.text"],
        Button1: ["Button1.text"],
      });
    });

    it(`When binding is removed`, () => {
      const translatedDiffs = [
        {
          payload: {
            propertyPath: "Button2.text",
            value: "abc",
          },
          event: "EDIT",
        },
      ];
      dataTreeEvaluator.updateDependencyMap(
        translatedDiffs as Array<DataTreeDiff>,
        dataTreeEvaluator.oldUnEvalTree,
      );

      expect(dataTreeEvaluator.dependencyMap).toStrictEqual({
        Button2: ["Button2.text"],
        Button1: ["Button1.text"],
      });
    });
  });
});
