import DataTreeEvaluator from ".";
import {
  asyncTagUnevalTree,
  emptyTreeWithAppsmithObject,
  lintingUnEvalTree,
  unEvalTree,
} from "./mockData/mockUnEvalTree";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  DataTreeDiff,
  DataTreeDiffEvent,
} from "workers/Evaluation/evaluationUtils";
import { ALL_WIDGETS_AND_CONFIG } from "utils/WidgetRegistry";
import { arrayAccessorCyclicDependency } from "./mockData/ArrayAccessorTree";
import { nestedArrayAccessorCyclicDependency } from "./mockData/NestedArrayAccessorTree";
import { updateDependencyMap } from "workers/common/DependencyMap";
import { parseJSActions } from "workers/Evaluation/JSObject";
import { WidgetConfiguration } from "widgets/constants";
import { JSUpdate, ParsedBody } from "../../../utils/JSPaneUtils";

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
      dataTreeEvaluator.setupFirstTree((unEvalTree as unknown) as DataTree);
      dataTreeEvaluator.evalAndValidateFirstTree();
    });

    it("initial dependencyMap computation", () => {
      const {
        evalOrder,
        nonDynamicFieldValidationOrder,
      } = dataTreeEvaluator.setupUpdateTree(
        (unEvalTree as unknown) as DataTree,
      );
      dataTreeEvaluator.evalAndValidateSubTree(
        evalOrder,
        nonDynamicFieldValidationOrder,
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
      });

      expect(dataTreeEvaluator.dependencyMap).toStrictEqual({
        Button2: ["Button2.text"],
        Button1: ["Button1.text"],
      });
    });
  });

  describe("parseJsActions", () => {
    beforeEach(() => {
      dataTreeEvaluator.setupFirstTree(
        (emptyTreeWithAppsmithObject as unknown) as DataTree,
      );
      dataTreeEvaluator.evalAndValidateFirstTree();
    });
    it("set's isAsync tag for cross JsObject references", () => {
      const result = parseJSActions(dataTreeEvaluator, asyncTagUnevalTree);
      const jsUpdatesForJsObject1 = (result as Record<string, JSUpdate>)[
        "JSObject1"
      ].parsedBody as ParsedBody;
      const jsUpdatesForJsObject2 = (result as Record<string, JSUpdate>)[
        "JSObject2"
      ].parsedBody as ParsedBody;
      expect(jsUpdatesForJsObject1.actions[0].isAsync).toBe(true);
      expect(jsUpdatesForJsObject2.actions[0].isAsync).toBe(true);
    });
  });

  describe("array accessor dependency handling", () => {
    const dataTreeEvaluator = new DataTreeEvaluator(widgetConfigMap);
    beforeEach(() => {
      dataTreeEvaluator.setupFirstTree(
        nestedArrayAccessorCyclicDependency.initUnEvalTree,
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
          } = dataTreeEvaluator.setupUpdateTree(
            arrayAccessorCyclicDependency.apiSuccessUnEvalTree,
          );
          dataTreeEvaluator.evalAndValidateSubTree(
            evalOrder,
            nonDynamicFieldValidationOrder1,
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
          const {
            evalOrder: order,
            nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder2,
          } = dataTreeEvaluator.setupUpdateTree(
            arrayAccessorCyclicDependency.apiFailureUnEvalTree,
          );
          dataTreeEvaluator.evalAndValidateSubTree(
            order,
            nonDynamicFieldValidationOrder2,
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
        } = dataTreeEvaluator.setupUpdateTree(
          arrayAccessorCyclicDependency.apiSuccessUnEvalTree,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order1,
          nonDynamicFieldValidationOrder3,
        );

        // success: response -> [{...}, {...}]
        const {
          evalOrder: order2,
          nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder4,
        } = dataTreeEvaluator.setupUpdateTree(
          arrayAccessorCyclicDependency.apiSuccessUnEvalTree2,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order2,
          nonDynamicFieldValidationOrder4,
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
          } = dataTreeEvaluator.setupUpdateTree(
            nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
          );
          dataTreeEvaluator.evalAndValidateSubTree(
            order,
            nonDynamicFieldValidationOrder5,
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
          const {
            evalOrder: order1,
            nonDynamicFieldValidationOrder,
          } = dataTreeEvaluator.setupUpdateTree(
            nestedArrayAccessorCyclicDependency.apiFailureUnEvalTree,
          );
          dataTreeEvaluator.evalAndValidateSubTree(
            order1,
            nonDynamicFieldValidationOrder,
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
        } = dataTreeEvaluator.setupUpdateTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order,
          nonDynamicFieldValidationOrder,
        );

        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}] ]
        const {
          evalOrder: order1,
          nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder2,
        } = dataTreeEvaluator.setupUpdateTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree2,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order1,
          nonDynamicFieldValidationOrder2,
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
        } = dataTreeEvaluator.setupUpdateTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order,
          nonDynamicFieldValidationOrder2,
        );

        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [] ]
        const {
          evalOrder: order1,
          nonDynamicFieldValidationOrder,
        } = dataTreeEvaluator.setupUpdateTree(
          nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree3,
        );
        dataTreeEvaluator.evalAndValidateSubTree(
          order1,
          nonDynamicFieldValidationOrder,
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
        (lintingUnEvalTree as unknown) as DataTree,
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
      const newUnEvalTree = ({ ...lintingUnEvalTree } as unknown) as DataTree;
      // delete Api2
      delete newUnEvalTree["Api2"];
      const {
        evalOrder,
        nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder2,
      } = dataTreeEvaluator.setupUpdateTree(newUnEvalTree);
      dataTreeEvaluator.evalAndValidateSubTree(
        evalOrder,
        nonDynamicFieldValidationOrder2,
      );
      expect(dataTreeEvaluator.triggerFieldDependencyMap).toEqual({
        "Button3.onClick": ["Api1.run", "Button2.text"],
        "Button2.onClick": [],
      });

      // Add Api2
      // @ts-expect-error: Types are not available
      newUnEvalTree["Api2"] = { ...lintingUnEvalTree }["Api2"];
      const {
        evalOrder: order1,
        nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder3,
      } = dataTreeEvaluator.setupUpdateTree(newUnEvalTree);
      dataTreeEvaluator.evalAndValidateSubTree(
        order1,
        nonDynamicFieldValidationOrder3,
      );
      expect(dataTreeEvaluator.triggerFieldDependencyMap).toEqual({
        "Button3.onClick": ["Api1.run", "Button2.text", "Api2.run"],
        "Button2.onClick": ["Api2.run"],
      });

      // self-reference Button2
      const newButton2 = { ...lintingUnEvalTree }["Button2"];
      newButton2.onClick = "{{Api2.run(); AbsentEntity.run(); Button2}}";
      // @ts-expect-error: Types are not available
      newUnEvalTree["Button2"] = newButton2;
      const {
        evalOrder: order2,
        nonDynamicFieldValidationOrder,
      } = dataTreeEvaluator.setupUpdateTree(newUnEvalTree);
      dataTreeEvaluator.evalAndValidateSubTree(
        order2,
        nonDynamicFieldValidationOrder,
      );

      // delete Button2
      delete newUnEvalTree["Button2"];
      const {
        evalOrder: order3,
        nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder4,
      } = dataTreeEvaluator.setupUpdateTree(newUnEvalTree);
      dataTreeEvaluator.evalAndValidateSubTree(
        order3,
        nonDynamicFieldValidationOrder4,
      );

      expect(dataTreeEvaluator.triggerFieldDependencyMap).toEqual({
        "Button3.onClick": ["Api1.run", "Api2.run"],
      });
    });
  });
});
