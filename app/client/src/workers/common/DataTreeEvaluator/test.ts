import DataTreeEvaluator from ".";
import {
  asyncTagUnevalTree,
  lintingUnEvalTree,
  unEvalTree,
} from "./mockData/mockUnEvalTree";
import { configTree, lintingConfigTree } from "./mockData/mockConfigTree";
import type { DataTree, ConfigTree } from "entities/DataTree/dataTreeFactory";
import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";
import { ALL_WIDGETS_AND_CONFIG } from "utils/WidgetRegistry";
import {
  arrayAccessorCyclicDependency,
  arrayAccessorCyclicDependencyConfig,
} from "./mockData/ArrayAccessorTree";
import {
  nestedArrayAccessorCyclicDependency,
  nestedArrayAccessorCyclicDependencyConfig,
} from "./mockData/NestedArrayAccessorTree";
import { updateDependencyMap } from "workers/common/DependencyMap";
import { parseJSActions } from "workers/Evaluation/JSObject";
import type { ActionEntityConfig } from "entities/DataTree/types";
import type { WidgetConfiguration } from "widgets/constants";

const widgetConfigMap: Record<
  string,
  {
    defaultProperties: WidgetConfiguration["properties"]["default"];
    derivedProperties: WidgetConfiguration["properties"]["derived"];
    metaProperties: WidgetConfiguration["properties"]["meta"];
  }
> = {};
ALL_WIDGETS_AND_CONFIG.map(([, config]) => {
  if (config.type && config.properties) {
    widgetConfigMap[config.type] = {
      defaultProperties: config.properties.default,
      derivedProperties: config.properties.derived,
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
      dataTreeEvaluator.setupFirstTree(
        unEvalTree as unknown as DataTree,
        configTree as unknown as ConfigTree,
      );
      dataTreeEvaluator.evalAndValidateFirstTree();
    });

    it("initial dependencyMap computation", () => {
      const { evalOrder, nonDynamicFieldValidationOrder, unEvalUpdates } =
        dataTreeEvaluator.setupUpdateTree(
          unEvalTree as unknown as DataTree,
          configTree as unknown as ConfigTree,
        );
      dataTreeEvaluator.evalAndValidateSubTree(
        evalOrder,
        nonDynamicFieldValidationOrder,
        configTree as unknown as ConfigTree,
        unEvalUpdates,
      );

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
      updateDependencyMap({
        configTree: configTree as unknown as ConfigTree,
        dataTreeEvalRef: dataTreeEvaluator,
        translatedDiffs: translatedDiffs as Array<DataTreeDiff>,
        unEvalDataTree: dataTreeEvaluator.oldUnEvalTree,
      });

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
      updateDependencyMap({
        dataTreeEvalRef: dataTreeEvaluator,
        translatedDiffs: translatedDiffs as Array<DataTreeDiff>,
        unEvalDataTree: dataTreeEvaluator.oldUnEvalTree,
        configTree: configTree as unknown as ConfigTree,
      });

      expect(dataTreeEvaluator.dependencyMap).toStrictEqual({
        Button2: ["Button2.text"],
        Button1: ["Button1.text"],
      });
    });
  });

  describe("parseJsActions", () => {
    const postMessageMock = jest.fn();
    beforeEach(() => {
      dataTreeEvaluator.setupFirstTree(
        {} as unknown as DataTree,
        {} as unknown as ConfigTree,
      );
      dataTreeEvaluator.evalAndValidateFirstTree();
      self.postMessage = postMessageMock;
    });
    it("set's isAsync tag for cross JsObject references", () => {
      const result = parseJSActions(dataTreeEvaluator, asyncTagUnevalTree);
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
      dataTreeEvaluator.setupFirstTree(
        nestedArrayAccessorCyclicDependency.initUnEvalTree,
        nestedArrayAccessorCyclicDependencyConfig.initConfigTree,
      );
      dataTreeEvaluator.evalAndValidateFirstTree();
    });
    describe("array of objects", () => {
      // when Text1.text has a binding Api1.data[2].id
      it("on consequent API failures", () => {
        // cyclic dependency case
        for (let i = 0; i < 2; i++) {
          // success: response -> [{...}, {...}, {...}]
          const {
            evalOrder,
            nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder1,
            unEvalUpdates,
          } = dataTreeEvaluator.setupUpdateTree(
            arrayAccessorCyclicDependency.apiSuccessUnEvalTree,
            arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
          );
          dataTreeEvaluator.evalAndValidateSubTree(
            evalOrder,
            nonDynamicFieldValidationOrder1,
            arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
            unEvalUpdates,
          );
          expect(dataTreeEvaluator.dependencyMap["Api1"]).toStrictEqual([
            "Api1.data",
          ]);
          expect(dataTreeEvaluator.dependencyMap["Api1.data"]).toStrictEqual([
            "Api1.data[2]",
          ]);
          expect(dataTreeEvaluator.dependencyMap["Api1.data[2]"]).toStrictEqual(
            ["Api1.data[2].id"],
          );
          expect(dataTreeEvaluator.dependencyMap["Text1.text"]).toStrictEqual([
            "Api1.data[2].id",
          ]);

          // failure: response -> {}
          const {
            evalOrder: order,
            nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder2,
            unEvalUpdates: unEvalUpdates2,
          } = dataTreeEvaluator.setupUpdateTree(
            arrayAccessorCyclicDependency.apiFailureUnEvalTree,
            arrayAccessorCyclicDependencyConfig.apiFailureConfigTree,
          );
          dataTreeEvaluator.evalAndValidateSubTree(
            order,
            nonDynamicFieldValidationOrder2,
            arrayAccessorCyclicDependencyConfig.apiFailureConfigTree,
            unEvalUpdates2,
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
        const {
          evalOrder: order1,
          nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder3,
          unEvalUpdates,
        } = dataTreeEvaluator.setupUpdateTree(
          arrayAccessorCyclicDependency.apiSuccessUnEvalTree,
          arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order1,
          nonDynamicFieldValidationOrder3,
          arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
          unEvalUpdates,
        );

        // success: response -> [{...}, {...}]
        const {
          evalOrder: order2,
          nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder4,
          unEvalUpdates: unEvalUpdates2,
        } = dataTreeEvaluator.setupUpdateTree(
          arrayAccessorCyclicDependency.apiSuccessUnEvalTree2,
          arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree2,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order2,
          nonDynamicFieldValidationOrder4,
          arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree2,
          unEvalUpdates2,
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
          const {
            evalOrder: order,
            nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder5,
            unEvalUpdates,
          } = dataTreeEvaluator.setupUpdateTree(
            nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
            nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
          );
          dataTreeEvaluator.evalAndValidateSubTree(
            order,
            nonDynamicFieldValidationOrder5,
            nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
            unEvalUpdates,
          );
          expect(dataTreeEvaluator.dependencyMap["Api1"]).toStrictEqual([
            "Api1.data",
          ]);
          expect(dataTreeEvaluator.dependencyMap["Api1.data"]).toStrictEqual([
            "Api1.data[2]",
          ]);
          expect(dataTreeEvaluator.dependencyMap["Api1.data[2]"]).toStrictEqual(
            ["Api1.data[2][2]"],
          );
          expect(
            dataTreeEvaluator.dependencyMap["Api1.data[2][2]"],
          ).toStrictEqual(["Api1.data[2][2].id"]);
          expect(dataTreeEvaluator.dependencyMap["Text1.text"]).toStrictEqual([
            "Api1.data[2][2].id",
          ]);

          // failure: response -> {}
          const {
            evalOrder: order1,
            nonDynamicFieldValidationOrder,
            unEvalUpdates: unEvalUpdates2,
          } = dataTreeEvaluator.setupUpdateTree(
            nestedArrayAccessorCyclicDependency.apiFailureUnEvalTree,
            nestedArrayAccessorCyclicDependencyConfig.apiFailureConfigTree,
          );
          dataTreeEvaluator.evalAndValidateSubTree(
            order1,
            nonDynamicFieldValidationOrder,
            nestedArrayAccessorCyclicDependencyConfig.apiFailureConfigTree,
            unEvalUpdates2,
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
        const {
          evalOrder: order,
          nonDynamicFieldValidationOrder,
          unEvalUpdates,
        } = dataTreeEvaluator.setupUpdateTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order,
          nonDynamicFieldValidationOrder,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
          unEvalUpdates,
        );

        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}] ]
        const {
          evalOrder: order1,
          nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder2,
          unEvalUpdates: unEvalUpdates2,
        } = dataTreeEvaluator.setupUpdateTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree2,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree2,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order1,
          nonDynamicFieldValidationOrder2,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree2,
          unEvalUpdates2,
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
        const {
          evalOrder: order,
          nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder2,
          unEvalUpdates,
        } = dataTreeEvaluator.setupUpdateTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order,
          nonDynamicFieldValidationOrder2,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
          unEvalUpdates,
        );

        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [] ]
        const {
          evalOrder: order1,
          nonDynamicFieldValidationOrder,
          unEvalUpdates: unEvalUpdates2,
        } = dataTreeEvaluator.setupUpdateTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree3,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree3,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order1,
          nonDynamicFieldValidationOrder,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree3,
          unEvalUpdates2,
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

  describe("triggerfield dependency map", () => {
    beforeEach(() => {
      dataTreeEvaluator.setupFirstTree(
        lintingUnEvalTree as unknown as DataTree,
        lintingConfigTree as unknown as ConfigTree,
      );
      dataTreeEvaluator.evalAndValidateFirstTree();
    });
    it("Creates correct triggerFieldDependencyMap", () => {
      expect(dataTreeEvaluator.triggerFieldDependencyMap).toEqual({
        "Button3.onClick": ["Api1.run", "Button2.text", "Api2.run"],
        "Button2.onClick": ["Api2.run"],
      });
    });

    it("Correctly updates triggerFieldDependencyMap", () => {
      const newUnEvalTree = { ...lintingUnEvalTree } as unknown as DataTree;
      const newConfigTree = { ...lintingConfigTree } as unknown as ConfigTree;
      // delete Api2
      delete newUnEvalTree["Api2"];
      delete newConfigTree["Api2"];
      const {
        evalOrder,
        nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder2,
        unEvalUpdates,
      } = dataTreeEvaluator.setupUpdateTree(newUnEvalTree, newConfigTree);
      dataTreeEvaluator.evalAndValidateSubTree(
        evalOrder,
        nonDynamicFieldValidationOrder2,
        newConfigTree,
        unEvalUpdates,
      );
      expect(dataTreeEvaluator.triggerFieldDependencyMap).toEqual({
        "Button3.onClick": ["Api1.run", "Button2.text"],
        "Button2.onClick": [],
      });

      // Add Api2
      // @ts-expect-error: Types are not available
      newUnEvalTree["Api2"] = { ...lintingUnEvalTree }["Api2"];
      newConfigTree["Api2"] = { ...lintingConfigTree }[
        "Api2"
      ] as ActionEntityConfig;
      const {
        evalOrder: order1,
        nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder3,
        unEvalUpdates: unEvalUpdates2,
      } = dataTreeEvaluator.setupUpdateTree(newUnEvalTree, newConfigTree);
      dataTreeEvaluator.evalAndValidateSubTree(
        order1,
        nonDynamicFieldValidationOrder3,
        newConfigTree,
        unEvalUpdates2,
      );
      expect(dataTreeEvaluator.triggerFieldDependencyMap).toEqual({
        "Button3.onClick": ["Api1.run", "Button2.text", "Api2.run"],
        "Button2.onClick": ["Api2.run"],
      });

      // // self-reference Button2
      const newButton2 = { ...lintingUnEvalTree }["Button2"];
      newButton2.onClick = "{{Api2.run(); AbsentEntity.run(); Button2}}";
      // @ts-expect-error: Types are not available
      newUnEvalTree["Button2"] = newButton2;
      const {
        evalOrder: order2,
        nonDynamicFieldValidationOrder,
        unEvalUpdates: unEvalUpdates3,
      } = dataTreeEvaluator.setupUpdateTree(newUnEvalTree, newConfigTree);
      dataTreeEvaluator.evalAndValidateSubTree(
        order2,
        nonDynamicFieldValidationOrder,
        newConfigTree,
        unEvalUpdates3,
      );

      // delete Button2
      delete newUnEvalTree["Button2"];
      delete newConfigTree["Button2"];
      const {
        evalOrder: order3,
        nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder4,
        unEvalUpdates: unEvalUpdates4,
      } = dataTreeEvaluator.setupUpdateTree(newUnEvalTree, newConfigTree);
      dataTreeEvaluator.evalAndValidateSubTree(
        order3,
        nonDynamicFieldValidationOrder4,
        newConfigTree,
        unEvalUpdates4,
      );

      expect(dataTreeEvaluator.triggerFieldDependencyMap).toEqual({
        "Button3.onClick": ["Api1.run", "Api2.run"],
      });
    });
  });
});
