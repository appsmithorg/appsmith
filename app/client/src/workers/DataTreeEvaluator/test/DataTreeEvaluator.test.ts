import DataTreeEvaluator from "../DataTreeEvaluator";
import { asyncTagUnevalTree, unEvalTree } from "./mockData/mockUnEvalTree";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { DataTreeDiff } from "workers/evaluationUtils";
import { ALL_WIDGETS_AND_CONFIG } from "utils/WidgetRegistry";
import { arrayAccessorCyclicDependency } from "./mockData/ArrayAccessorTree";
import { nestedArrayAccessorCyclicDependency } from "./mockData/NestedArrayAccessorTree";

const widgetConfigMap = {};
ALL_WIDGETS_AND_CONFIG.map(([, config]) => {
  // @ts-expect-error: Types are not available
  if (config.type && config.properties) {
    // @ts-expect-error: Types are not available
    widgetConfigMap[config.type] = {
      // @ts-expect-error: properties does not exists
      defaultProperties: config.properties.default,
      // @ts-expect-error: properties does not exists
      derivedProperties: config.properties.derived,
      // @ts-expect-error: properties does not exists
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
      // @ts-expect-error: Types are not available
      dataTreeEvaluator.createFirstTree(unEvalTree as DataTree);
    });

    it("initial dependencyMap computation", () => {
      // @ts-expect-error: Types are not available
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

  describe("parseJsActions", () => {
    beforeEach(() => {
      dataTreeEvaluator.createFirstTree({});
    });
    it("set's isAsync tag for cross JsObject references", () => {
      const result = dataTreeEvaluator.parseJSActions(asyncTagUnevalTree);
      expect(
        result.jsUpdates["JSObject1"]?.parsedBody?.actions[0].isAsync,
      ).toBe(true);
      expect(
        result.jsUpdates["JSObject2"]?.parsedBody?.actions[0].isAsync,
      ).toBe(true);
    });
  });

  describe("array accessor dependency handling", () => {
    const dataTreeEvaluator = new DataTreeEvaluator(widgetConfigMap);
    beforeEach(() => {
      dataTreeEvaluator.createFirstTree(
        nestedArrayAccessorCyclicDependency.initUnEvalTree,
      );
    });
    describe("array of objects", () => {
      // when Text1.text has a binding Api1.data[2].id
      it("on consequent API failures", () => {
        // cyclic dependency case
        for (let i = 0; i < 2; i++) {
          // success: response -> [{...}, {...}, {...}]
          dataTreeEvaluator.updateDataTree(
            arrayAccessorCyclicDependency.apiSuccessUnEvalTree,
          );
          expect(dataTreeEvaluator.dependencyMap["Api1"]).toStrictEqual([
            "Api1.data",
          ]);
          expect(dataTreeEvaluator.dependencyMap["Api1.data"]).toStrictEqual([
            "Api1.data[2]",
          ]);
          expect(
            dataTreeEvaluator.dependencyMap["Api1.data[2]"],
          ).toStrictEqual(["Api1.data[2].id"]);
          expect(dataTreeEvaluator.dependencyMap["Text1.text"]).toStrictEqual([
            "Api1.data[2].id",
          ]);

          // failure: response -> {}
          dataTreeEvaluator.updateDataTree(
            arrayAccessorCyclicDependency.apiFailureUnEvalTree,
          );
          expect(dataTreeEvaluator.dependencyMap["Api1"]).toStrictEqual([
            "Api1.data",
          ]);
          expect(dataTreeEvaluator.dependencyMap["Api1.data"]).toStrictEqual(
            [],
          );
          expect(dataTreeEvaluator.dependencyMap["Api1.data[2]"]).toStrictEqual(
            undefined,
          );
          expect(dataTreeEvaluator.dependencyMap["Text1.text"]).toStrictEqual(
            [],
          );
        }
      });

      // when Text1.text has a binding Api1.data[2].id
      it("on API response array length change", () => {
        // success: response -> [{...}, {...}, {...}]
        dataTreeEvaluator.updateDataTree(
          arrayAccessorCyclicDependency.apiSuccessUnEvalTree,
        );

        // success: response -> [{...}, {...}]
        dataTreeEvaluator.updateDataTree(
          arrayAccessorCyclicDependency.apiSuccessUnEvalTree2,
        );
        expect(dataTreeEvaluator.dependencyMap["Api1"]).toStrictEqual([
          "Api1.data",
        ]);
        expect(dataTreeEvaluator.dependencyMap["Api1.data"]).toStrictEqual([]);
        expect(dataTreeEvaluator.dependencyMap["Api1.data[2]"]).toStrictEqual(
          undefined,
        );
        expect(dataTreeEvaluator.dependencyMap["Text1.text"]).toStrictEqual([]);
      });
    });

    describe("nested array of objects", () => {
      // when Text1.text has a binding Api1.data[2][2].id
      it("on consequent API failures", () => {
        // cyclic dependency case
        for (let i = 0; i < 2; i++) {
          // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [{...}, {...}, {...}] ]
          dataTreeEvaluator.updateDataTree(
            nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
          );
          expect(dataTreeEvaluator.dependencyMap["Api1"]).toStrictEqual([
            "Api1.data",
          ]);
          expect(dataTreeEvaluator.dependencyMap["Api1.data"]).toStrictEqual([
            "Api1.data[2]",
          ]);
          expect(
            dataTreeEvaluator.dependencyMap["Api1.data[2]"],
          ).toStrictEqual(["Api1.data[2][2]"]);
          expect(
            dataTreeEvaluator.dependencyMap["Api1.data[2][2]"],
          ).toStrictEqual(["Api1.data[2][2].id"]);
          expect(dataTreeEvaluator.dependencyMap["Text1.text"]).toStrictEqual([
            "Api1.data[2][2].id",
          ]);

          // failure: response -> {}
          dataTreeEvaluator.updateDataTree(
            nestedArrayAccessorCyclicDependency.apiFailureUnEvalTree,
          );
          expect(dataTreeEvaluator.dependencyMap["Api1"]).toStrictEqual([
            "Api1.data",
          ]);
          expect(dataTreeEvaluator.dependencyMap["Api1.data"]).toStrictEqual(
            [],
          );
          expect(dataTreeEvaluator.dependencyMap["Api1.data[2]"]).toStrictEqual(
            undefined,
          );
          expect(
            dataTreeEvaluator.dependencyMap["Api1.data[2][2]"],
          ).toStrictEqual(undefined);
          expect(dataTreeEvaluator.dependencyMap["Text1.text"]).toStrictEqual(
            [],
          );
        }
      });

      // when Text1.text has a binding Api1.data[2][2].id
      it("on API response array length change", () => {
        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [{...}, {...}, {...}] ]
        dataTreeEvaluator.updateDataTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
        );

        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}] ]
        dataTreeEvaluator.updateDataTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree2,
        );
        expect(dataTreeEvaluator.dependencyMap["Api1"]).toStrictEqual([
          "Api1.data",
        ]);
        expect(dataTreeEvaluator.dependencyMap["Api1.data"]).toStrictEqual([]);
        expect(dataTreeEvaluator.dependencyMap["Api1.data[2]"]).toStrictEqual(
          undefined,
        );
        expect(
          dataTreeEvaluator.dependencyMap["Api1.data[2][2]"],
        ).toStrictEqual(undefined);
        expect(dataTreeEvaluator.dependencyMap["Text1.text"]).toStrictEqual([]);
      });

      // when Text1.text has a binding Api1.data[2][2].id
      it("on API response nested array length change", () => {
        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [{...}, {...}, {...}] ]
        dataTreeEvaluator.updateDataTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
        );

        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [] ]
        dataTreeEvaluator.updateDataTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree3,
        );
        expect(dataTreeEvaluator.dependencyMap["Api1"]).toStrictEqual([
          "Api1.data",
        ]);
        expect(dataTreeEvaluator.dependencyMap["Api1.data"]).toStrictEqual([
          "Api1.data[2]",
        ]);
        expect(dataTreeEvaluator.dependencyMap["Api1.data[2]"]).toStrictEqual(
          [],
        );
        expect(
          dataTreeEvaluator.dependencyMap["Api1.data[2][2]"],
        ).toStrictEqual(undefined);
        expect(dataTreeEvaluator.dependencyMap["Text1.text"]).toStrictEqual([]);
      });
    });
  });
});
