import DataTreeEvaluator from ".";
import { unEvalTree } from "./mockData/mockUnEvalTree";
import { configTree } from "./mockData/mockConfigTree";
import type { DataTree, ConfigTree } from "entities/DataTree/dataTreeTypes";
import type { DataTreeDiff } from "ee/workers/Evaluation/evaluationUtils";
import {
  arrayAccessorCyclicDependency,
  arrayAccessorCyclicDependencyConfig,
} from "./mockData/ArrayAccessorTree";
import {
  nestedArrayAccessorCyclicDependency,
  nestedArrayAccessorCyclicDependencyConfig,
} from "./mockData/NestedArrayAccessorTree";
import { updateDependencyMap } from "workers/common/DependencyMap";
import { replaceThisDotParams } from "./utils";
import { isDataField } from "./utils";
import widgets from "widgets";
import type { WidgetConfiguration } from "WidgetProvider/constants";
import {
  EvaluationSubstitutionType,
  type WidgetEntity,
} from "ee/entities/DataTree/types";
import {
  EXECUTION_PARAM_KEY,
  EXECUTION_PARAM_REFERENCE_REGEX,
} from "constants/AppsmithActionConstants/ActionConstants";
import generateOverrideContext from "ee/workers/Evaluation/generateOverrideContext";
import { klona } from "klona";
import { APP_MODE } from "entities/App";

const widgetConfigMap: Record<
  string,
  {
    defaultProperties: WidgetConfiguration["properties"]["default"];
    derivedProperties: WidgetConfiguration["properties"]["derived"];
    metaProperties: WidgetConfiguration["properties"]["meta"];
  }
> = {};
widgets.map((widget) => {
  if (widget.type) {
    widgetConfigMap[widget.type] = {
      defaultProperties: widget.getDefaultPropertiesMap(),
      derivedProperties: widget.getDerivedPropertiesMap(),
      metaProperties: widget.getMetaPropertiesMap(),
    };
  }
});

jest.mock("ee/workers/Evaluation/generateOverrideContext"); // mock the generateOverrideContext function

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

    // The test should verify that generateOverrideContext is called and passed as context to getDynamicValue
    it("should call generateOverrideContext and pass as context to getDynamicValue", () => {
      const overrideContextValue = { "ModuleInstance1.inputs.input1": "200" };

      let generateOverrideContextParams;
      // Mock generateOverrideContext only for this test
      const originalGenerateOverrideContext = generateOverrideContext;
      (generateOverrideContext as jest.Mock).mockImplementation((params) => {
        // The dataTree gets mutated in evaluateActionBindings thus modifying the
        // original params passed to this function. This helps preserving the params
        // actually passed.
        generateOverrideContextParams = klona(params);
        return overrideContextValue;
      });

      const widgetConfigMap = {};
      const dataTreeEvaluator = new DataTreeEvaluator(widgetConfigMap);
      const dataTree = {
        Text1: {
          text: "Hello",
        },
        ModuleInstance1: {
          inputs: {
            input1: "10",
          },
        },
      } as unknown as DataTree;
      const bindings = [
        "(function() { return this.params.property })()",
        "(() => { return this.params.property })()",
        'this.params.property || "default value"',
        'this.params.property1 || "default value"',
        "ModuleInstance1.inputs.input1",
      ];
      const executionParams = {
        property: "my value",
        input1: "200",
      };
      dataTreeEvaluator.evalTree = klona(dataTree);

      const originalGetDynamicValue =
        dataTreeEvaluator.getDynamicValue.bind(dataTreeEvaluator);
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getDynamicValueCapturedParams: any[] = [];
      jest.spyOn(dataTreeEvaluator, "getDynamicValue");
      (dataTreeEvaluator.getDynamicValue as jest.Mock).mockImplementation(
        (...args) => {
          getDynamicValueCapturedParams.push(args);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return originalGetDynamicValue(...args);
        },
      );

      // Call the method under test
      const result = dataTreeEvaluator.evaluateActionBindings(
        bindings,
        executionParams,
      );

      expect(generateOverrideContext).toHaveBeenCalled();
      expect(generateOverrideContextParams).toEqual({
        bindings,
        executionParams,
        dataTree,
      });

      // Check results
      expect(result).toEqual([
        "my value",
        "my value",
        "my value",
        "default value",
        "200",
      ]);

      // Verify getDynamicValue receives the correct parameters
      // The first call is always with executionParams
      [`${JSON.stringify(executionParams)}`, ...bindings].forEach(
        (binding, index) => {
          const replacedBinding = binding.replace(
            EXECUTION_PARAM_REFERENCE_REGEX,
            EXECUTION_PARAM_KEY,
          );

          let defaultExpectedValue = [
            `{{${replacedBinding}}}`,
            klona(dataTree),
            dataTreeEvaluator.oldConfigTree,
            EvaluationSubstitutionType.TEMPLATE,
          ];

          if (index !== 0) {
            defaultExpectedValue = [
              ...defaultExpectedValue,
              expect.objectContaining({
                overrideContext: overrideContextValue,
              }),
            ];
          }
          expect(getDynamicValueCapturedParams[index]).toEqual(
            defaultExpectedValue,
          );
        },
      );

      // Restore the original function after the test
      (generateOverrideContext as jest.Mock).mockImplementation(
        originalGenerateOverrideContext,
      );
    });
  });

  describe("test updateDependencyMap", () => {
    beforeEach(async () => {
      await dataTreeEvaluator.setupFirstTree(
        unEvalTree as unknown as DataTree,
        configTree as unknown as ConfigTree,
        {},
        {
          appId: "appId",
          pageId: "pageId",
          timestamp: "timestamp",
          appMode: APP_MODE.PUBLISHED,
          instanceId: "instanceId",
          workspaceId: "workspaceId",
        },
      );
      dataTreeEvaluator.evalAndValidateFirstTree();
    });

    it("initial dependencyMap computation", () => {
      const { evalOrder, unEvalUpdates } = dataTreeEvaluator.setupUpdateTree(
        unEvalTree as unknown as DataTree,
        configTree as unknown as ConfigTree,
      );
      dataTreeEvaluator.evalAndValidateSubTree(
        evalOrder,
        configTree as unknown as ConfigTree,
        unEvalUpdates,
      );

      expect(dataTreeEvaluator.dependencies).toStrictEqual({
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
      const button2 = dataTreeEvaluator.oldUnEvalTree.Button2 as WidgetEntity;
      const newUnevalTree = {
        ...dataTreeEvaluator.oldUnEvalTree,
        Button2: {
          ...button2,
          text: '{{""}}',
        },
      };
      const { dependencies } = updateDependencyMap({
        configTree: configTree as unknown as ConfigTree,
        dataTreeEvalRef: dataTreeEvaluator,
        translatedDiffs: translatedDiffs as Array<DataTreeDiff>,
        unEvalDataTree: newUnevalTree,
      });

      expect(dependencies).toStrictEqual({
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
      const button2 = dataTreeEvaluator.oldUnEvalTree.Button2 as WidgetEntity;
      const newUnevalTree = {
        ...dataTreeEvaluator.oldUnEvalTree,
        Button2: {
          ...button2,
          text: "abc",
        },
      };
      const { dependencies } = updateDependencyMap({
        dataTreeEvalRef: dataTreeEvaluator,
        translatedDiffs: translatedDiffs as Array<DataTreeDiff>,
        unEvalDataTree: newUnevalTree,
        configTree: configTree as unknown as ConfigTree,
      });

      expect(dependencies).toStrictEqual({
        Button2: ["Button2.text"],
        Button1: ["Button1.text"],
        "Button2.text": [],
      });
    });
  });

  describe("array accessor dependency handling", () => {
    const dataTreeEvaluator = new DataTreeEvaluator(widgetConfigMap);
    beforeEach(async () => {
      await dataTreeEvaluator.setupFirstTree(
        nestedArrayAccessorCyclicDependency.initUnEvalTree,
        nestedArrayAccessorCyclicDependencyConfig.initConfigTree,
        {},
        {
          appId: "appId",
          pageId: "pageId",
          timestamp: "timestamp",
          appMode: APP_MODE.PUBLISHED,
          instanceId: "instanceId",
          workspaceId: "workspaceId",
        },
      );
      dataTreeEvaluator.evalAndValidateFirstTree();
    });
    describe("array of objects", () => {
      // when Text1.text has a binding Api1.data[2].id
      it("on consequent API failures", () => {
        // cyclic dependency case
        for (let i = 0; i < 2; i++) {
          // success: response -> [{...}, {...}, {...}]
          const { evalOrder, unEvalUpdates } =
            dataTreeEvaluator.setupUpdateTree(
              arrayAccessorCyclicDependency.apiSuccessUnEvalTree,
              arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
            );
          dataTreeEvaluator.evalAndValidateSubTree(
            evalOrder,
            arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
            unEvalUpdates,
          );
          expect(dataTreeEvaluator.dependencies["Api1"]).toStrictEqual([
            "Api1.data",
          ]);
          expect(dataTreeEvaluator.dependencies["Api1.data"]).toStrictEqual([
            "Api1.data[2]",
          ]);
          expect(dataTreeEvaluator.dependencies["Api1.data[2]"]).toStrictEqual([
            "Api1.data[2].id",
          ]);
          expect(dataTreeEvaluator.dependencies["Text1.text"]).toStrictEqual([
            "Api1.data[2].id",
          ]);

          // failure: response -> {}
          const { evalOrder: order, unEvalUpdates: unEvalUpdates2 } =
            dataTreeEvaluator.setupUpdateTree(
              arrayAccessorCyclicDependency.apiFailureUnEvalTree,
              arrayAccessorCyclicDependencyConfig.apiFailureConfigTree,
            );
          dataTreeEvaluator.evalAndValidateSubTree(
            order,
            arrayAccessorCyclicDependencyConfig.apiFailureConfigTree,
            unEvalUpdates2,
          );

          expect(dataTreeEvaluator.dependencies["Api1"]).toStrictEqual([
            "Api1.data",
          ]);
          expect(dataTreeEvaluator.dependencies["Api1.data"]).toStrictEqual([]);
          expect(dataTreeEvaluator.dependencies["Api1.data[2]"]).toStrictEqual(
            undefined,
          );
          expect(dataTreeEvaluator.dependencies["Text1.text"]).toStrictEqual(
            [],
          );
        }
      });

      // when Text1.text has a binding Api1.data[2].id
      it("on API response array length change", () => {
        // success: response -> [{...}, {...}, {...}]
        const { evalOrder: order1, unEvalUpdates } =
          dataTreeEvaluator.setupUpdateTree(
            arrayAccessorCyclicDependency.apiSuccessUnEvalTree,
            arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
          );
        dataTreeEvaluator.evalAndValidateSubTree(
          order1,
          arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
          unEvalUpdates,
        );

        // success: response -> [{...}, {...}]
        const { evalOrder: order2, unEvalUpdates: unEvalUpdates2 } =
          dataTreeEvaluator.setupUpdateTree(
            arrayAccessorCyclicDependency.apiSuccessUnEvalTree2,
            arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree2,
          );
        dataTreeEvaluator.evalAndValidateSubTree(
          order2,
          arrayAccessorCyclicDependencyConfig.apiSuccessConfigTree2,
          unEvalUpdates2,
        );

        expect(dataTreeEvaluator.dependencies["Api1"]).toStrictEqual([
          "Api1.data",
        ]);
        expect(dataTreeEvaluator.dependencies["Api1.data"]).toStrictEqual([]);
        expect(dataTreeEvaluator.dependencies["Api1.data[2]"]).toStrictEqual(
          undefined,
        );
        expect(dataTreeEvaluator.dependencies["Text1.text"]).toStrictEqual([]);
      });
    });

    describe("nested array of objects", () => {
      // when Text1.text has a binding Api1.data[2][2].id
      it("on consequent API failures", () => {
        // cyclic dependency case
        for (let i = 0; i < 2; i++) {
          // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [{...}, {...}, {...}] ]
          const { evalOrder: order, unEvalUpdates } =
            dataTreeEvaluator.setupUpdateTree(
              nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
              nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
            );
          dataTreeEvaluator.evalAndValidateSubTree(
            order,
            nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
            unEvalUpdates,
          );
          expect(dataTreeEvaluator.dependencies["Api1"]).toStrictEqual([
            "Api1.data",
          ]);
          expect(dataTreeEvaluator.dependencies["Api1.data"]).toStrictEqual([
            "Api1.data[2]",
          ]);
          expect(dataTreeEvaluator.dependencies["Api1.data[2]"]).toStrictEqual([
            "Api1.data[2][2]",
          ]);
          expect(
            dataTreeEvaluator.dependencies["Api1.data[2][2]"],
          ).toStrictEqual(["Api1.data[2][2].id"]);
          expect(dataTreeEvaluator.dependencies["Text1.text"]).toStrictEqual([
            "Api1.data[2][2].id",
          ]);

          // failure: response -> {}
          const { evalOrder: order1, unEvalUpdates: unEvalUpdates2 } =
            dataTreeEvaluator.setupUpdateTree(
              nestedArrayAccessorCyclicDependency.apiFailureUnEvalTree,
              nestedArrayAccessorCyclicDependencyConfig.apiFailureConfigTree,
            );
          dataTreeEvaluator.evalAndValidateSubTree(
            order1,
            nestedArrayAccessorCyclicDependencyConfig.apiFailureConfigTree,
            unEvalUpdates2,
          );
          expect(dataTreeEvaluator.dependencies["Api1"]).toStrictEqual([
            "Api1.data",
          ]);
          expect(dataTreeEvaluator.dependencies["Api1.data"]).toStrictEqual([]);
          expect(dataTreeEvaluator.dependencies["Api1.data[2]"]).toStrictEqual(
            undefined,
          );
          expect(
            dataTreeEvaluator.dependencies["Api1.data[2][2]"],
          ).toStrictEqual(undefined);
          expect(dataTreeEvaluator.dependencies["Text1.text"]).toStrictEqual(
            [],
          );
        }
      });

      // when Text1.text has a binding Api1.data[2][2].id
      it("on API response array length change", () => {
        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [{...}, {...}, {...}] ]
        const { evalOrder: order, unEvalUpdates } =
          dataTreeEvaluator.setupUpdateTree(
            nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
            nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
          );
        dataTreeEvaluator.evalAndValidateSubTree(
          order,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
          unEvalUpdates,
        );

        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}] ]
        const { evalOrder: order1, unEvalUpdates: unEvalUpdates2 } =
          dataTreeEvaluator.setupUpdateTree(
            nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree2,
            nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree2,
          );
        dataTreeEvaluator.evalAndValidateSubTree(
          order1,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree2,
          unEvalUpdates2,
        );

        expect(dataTreeEvaluator.dependencies["Api1"]).toStrictEqual([
          "Api1.data",
        ]);
        expect(dataTreeEvaluator.dependencies["Api1.data"]).toStrictEqual([]);
        expect(dataTreeEvaluator.dependencies["Api1.data[2]"]).toStrictEqual(
          undefined,
        );
        expect(dataTreeEvaluator.dependencies["Api1.data[2][2]"]).toStrictEqual(
          undefined,
        );
        expect(dataTreeEvaluator.dependencies["Text1.text"]).toStrictEqual([]);
      });

      // when Text1.text has a binding Api1.data[2][2].id
      it("on API response nested array length change", () => {
        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [{...}, {...}, {...}] ]
        const { evalOrder: order, unEvalUpdates } =
          dataTreeEvaluator.setupUpdateTree(
            nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree,
            nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
          );
        dataTreeEvaluator.evalAndValidateSubTree(
          order,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree,
          unEvalUpdates,
        );

        // success: response -> [ [{...}, {...}, {...}], [{...}, {...}, {...}], [] ]
        const { evalOrder: order1, unEvalUpdates: unEvalUpdates2 } =
          dataTreeEvaluator.setupUpdateTree(
            nestedArrayAccessorCyclicDependency.apiSuccessUnEvalTree3,
            nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree3,
          );
        dataTreeEvaluator.evalAndValidateSubTree(
          order1,
          nestedArrayAccessorCyclicDependencyConfig.apiSuccessConfigTree3,
          unEvalUpdates2,
        );
        expect(dataTreeEvaluator.dependencies["Api1"]).toStrictEqual([
          "Api1.data",
        ]);
        expect(dataTreeEvaluator.dependencies["Api1.data"]).toStrictEqual([
          "Api1.data[2]",
        ]);
        expect(dataTreeEvaluator.dependencies["Api1.data[2]"]).toStrictEqual(
          [],
        );
        expect(dataTreeEvaluator.dependencies["Api1.data[2][2]"]).toStrictEqual(
          undefined,
        );
        expect(dataTreeEvaluator.dependencies["Text1.text"]).toStrictEqual([]);
      });
    });
  });
});

describe("replaceThisDotParams", () => {
  describe("no optional chaining this.params", () => {
    it("1. IIFEE with function keyword", () => {
      const code = "{{ (function() { return this.params.condition })() }}";
      const replaced = replaceThisDotParams(code);

      expect(replaced).toBe(
        "{{ (function() { return $params.condition })() }}",
      );
    });

    it("2. IIFEE with arrow function", () => {
      const code = "{{ (() => { return this.params.condition })() }}";
      const replaced = replaceThisDotParams(code);

      expect(replaced).toBe("{{ (() => { return $params.condition })() }}");
    });

    it("3. normal binding", () => {
      const code = "{{ this.params.condition }}";
      const replaced = replaceThisDotParams(code);

      expect(replaced).toBe("{{ $params.condition }}");
    });
  });

  describe("optional chaining this?.params", () => {
    it("1. IIFEE with function keyword", () => {
      const code = "{{ (function() { return this?.params.condition })() }}";
      const replaced = replaceThisDotParams(code);

      expect(replaced).toBe(
        "{{ (function() { return $params.condition })() }}",
      );
    });

    it("2. IIFEE with arrow function", () => {
      const code = "{{ (() => { return this?.params.condition })() }}";
      const replaced = replaceThisDotParams(code);

      expect(replaced).toBe("{{ (() => { return $params.condition })() }}");
    });

    it("3. normal binding", () => {
      const code = "{{ this?.params.condition }}";
      const replaced = replaceThisDotParams(code);

      expect(replaced).toBe("{{ $params.condition }}");
    });
  });

  describe("optional chaining this?.params?.condition", () => {
    it("1. IIFEE with function keyword", () => {
      const code = "{{ (function() { return this?.params?.condition })() }}";
      const replaced = replaceThisDotParams(code);

      expect(replaced).toBe(
        "{{ (function() { return $params?.condition })() }}",
      );
    });

    it("2. IIFEE with arrow function", () => {
      const code = "{{ (() => { return this?.params?.condition })() }}";
      const replaced = replaceThisDotParams(code);

      expect(replaced).toBe("{{ (() => { return $params?.condition })() }}");
    });

    it("3. normal binding", () => {
      const code = "{{ this?.params?.condition }}";
      const replaced = replaceThisDotParams(code);

      expect(replaced).toBe("{{ $params?.condition }}");
    });
  });
});

describe("isDataField", () => {
  const configTree = {
    JSObject1: {
      actionId: "642d384a630f4634e27a67ff",
      meta: {
        myFun2: {
          arguments: [],
          confirmBeforeExecute: false,
        },
        myFun1: {
          arguments: [],
          confirmBeforeExecute: false,
        },
      },
      name: "JSObject1",
      pluginType: "JS",
      ENTITY_TYPE: "JSACTION",
      bindingPaths: {
        body: "SMART_SUBSTITUTE",
        superbaseClient: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        body: "SMART_SUBSTITUTE",
        superbaseClient: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "superbaseClient",
        },
        {
          key: "myVar2",
        },
        {
          key: "myFun2",
        },
        {
          key: "myFun1",
        },
      ],
      variables: ["superbaseClient", "myVar2"],
      dependencyMap: {
        body: ["myFun2", "myFun1"],
      },
    },
    JSObject2: {
      actionId: "644242aeadc0936a9b0e71cc",
      meta: {
        myFun2: {
          arguments: [],

          confirmBeforeExecute: false,
        },
        myFun1: {
          arguments: [],

          confirmBeforeExecute: false,
        },
      },
      name: "JSObject2",
      pluginType: "JS",
      ENTITY_TYPE: "JSACTION",
      bindingPaths: {
        body: "SMART_SUBSTITUTE",
        supabaseClient: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        body: "SMART_SUBSTITUTE",
        supabaseClient: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "supabaseClient",
        },
        {
          key: "myVar2",
        },
        {
          key: "myFun2",
        },
        {
          key: "myFun1",
        },
      ],
      variables: ["supabaseClient", "myVar2"],
      dependencyMap: {
        body: ["myFun2", "myFun1"],
      },
    },
    MainContainer: {
      defaultProps: {},
      defaultMetaProps: [],
      dynamicBindingPathList: [],
      logBlackList: {},
      bindingPaths: {},
      reactivePaths: {},
      triggerPaths: {},
      validationPaths: {},
      ENTITY_TYPE: "WIDGET",
      privateWidgets: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      type: "CANVAS_WIDGET",
      dynamicTriggerPathList: [],
      isMetaPropDirty: false,
      widgetId: "0",
    },
    Button1: {
      defaultProps: {},
      defaultMetaProps: ["recaptchaToken"],
      dynamicBindingPathList: [
        {
          key: "buttonColor",
        },
        {
          key: "borderRadius",
        },
        {
          key: "text",
        },
      ],
      logBlackList: {},
      bindingPaths: {
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      reactivePaths: {
        recaptchaToken: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      triggerPaths: {
        onClick: true,
      },
      validationPaths: {
        text: {
          type: "TEXT",
        },
        tooltip: {
          type: "TEXT",
        },
        isVisible: {
          type: "BOOLEAN",
        },
        isDisabled: {
          type: "BOOLEAN",
        },
        animateLoading: {
          type: "BOOLEAN",
        },
        googleRecaptchaKey: {
          type: "TEXT",
        },
        recaptchaType: {
          type: "TEXT",
          params: {
            allowedValues: ["V3", "V2"],
            default: "V3",
          },
        },
        disabledWhenInvalid: {
          type: "BOOLEAN",
        },
        resetFormOnClick: {
          type: "BOOLEAN",
        },
        buttonVariant: {
          type: "TEXT",
          params: {
            allowedValues: ["PRIMARY", "SECONDARY", "TERTIARY"],
            default: "PRIMARY",
          },
        },
        iconName: {
          type: "TEXT",
        },
        placement: {
          type: "TEXT",
          params: {
            allowedValues: ["START", "BETWEEN", "CENTER"],
            default: "CENTER",
          },
        },
        buttonColor: {
          type: "TEXT",
        },
        borderRadius: {
          type: "TEXT",
        },
        boxShadow: {
          type: "TEXT",
        },
      },
      ENTITY_TYPE: "WIDGET",
      privateWidgets: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      type: "BUTTON_WIDGET",
      dynamicTriggerPathList: [],
      isMetaPropDirty: false,
      widgetId: "19ih8rt2eo",
    },
    Button2: {
      defaultProps: {},
      defaultMetaProps: ["recaptchaToken"],
      dynamicBindingPathList: [
        {
          key: "buttonColor",
        },
        {
          key: "borderRadius",
        },
      ],
      logBlackList: {},
      bindingPaths: {
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      reactivePaths: {
        recaptchaToken: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      triggerPaths: {
        onClick: true,
      },
      validationPaths: {
        text: {
          type: "TEXT",
        },
        tooltip: {
          type: "TEXT",
        },
        isVisible: {
          type: "BOOLEAN",
        },
        isDisabled: {
          type: "BOOLEAN",
        },
        animateLoading: {
          type: "BOOLEAN",
        },
        googleRecaptchaKey: {
          type: "TEXT",
        },
        recaptchaType: {
          type: "TEXT",
          params: {
            allowedValues: ["V3", "V2"],
            default: "V3",
          },
        },
        disabledWhenInvalid: {
          type: "BOOLEAN",
        },
        resetFormOnClick: {
          type: "BOOLEAN",
        },
        buttonVariant: {
          type: "TEXT",
          params: {
            allowedValues: ["PRIMARY", "SECONDARY", "TERTIARY"],
            default: "PRIMARY",
          },
        },
        iconName: {
          type: "TEXT",
        },
        placement: {
          type: "TEXT",
          params: {
            allowedValues: ["START", "BETWEEN", "CENTER"],
            default: "CENTER",
          },
        },
        buttonColor: {
          type: "TEXT",
        },
        borderRadius: {
          type: "TEXT",
        },
        boxShadow: {
          type: "TEXT",
        },
      },
      ENTITY_TYPE: "WIDGET",
      privateWidgets: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      type: "BUTTON_WIDGET",
      dynamicPropertyPathList: [
        {
          key: "onClick",
        },
      ],
      dynamicTriggerPathList: [
        {
          key: "onClick",
        },
      ],
      isMetaPropDirty: false,
      widgetId: "vss3w1eecd",
    },
    Button3: {
      defaultProps: {},
      defaultMetaProps: ["recaptchaToken"],
      dynamicBindingPathList: [
        {
          key: "buttonColor",
        },
        {
          key: "borderRadius",
        },
      ],
      logBlackList: {},
      bindingPaths: {
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      reactivePaths: {
        recaptchaToken: "TEMPLATE",
        buttonColor: "TEMPLATE",
        borderRadius: "TEMPLATE",
        text: "TEMPLATE",
        tooltip: "TEMPLATE",
        isVisible: "TEMPLATE",
        isDisabled: "TEMPLATE",
        animateLoading: "TEMPLATE",
        googleRecaptchaKey: "TEMPLATE",
        recaptchaType: "TEMPLATE",
        disabledWhenInvalid: "TEMPLATE",
        resetFormOnClick: "TEMPLATE",
        buttonVariant: "TEMPLATE",
        iconName: "TEMPLATE",
        placement: "TEMPLATE",
        boxShadow: "TEMPLATE",
      },
      triggerPaths: {
        onClick: true,
      },
      validationPaths: {
        text: {
          type: "TEXT",
        },
        tooltip: {
          type: "TEXT",
        },
        isVisible: {
          type: "BOOLEAN",
        },
        isDisabled: {
          type: "BOOLEAN",
        },
        animateLoading: {
          type: "BOOLEAN",
        },
        googleRecaptchaKey: {
          type: "TEXT",
        },
        recaptchaType: {
          type: "TEXT",
          params: {
            allowedValues: ["V3", "V2"],
            default: "V3",
          },
        },
        disabledWhenInvalid: {
          type: "BOOLEAN",
        },
        resetFormOnClick: {
          type: "BOOLEAN",
        },
        buttonVariant: {
          type: "TEXT",
          params: {
            allowedValues: ["PRIMARY", "SECONDARY", "TERTIARY"],
            default: "PRIMARY",
          },
        },
        iconName: {
          type: "TEXT",
        },
        placement: {
          type: "TEXT",
          params: {
            allowedValues: ["START", "BETWEEN", "CENTER"],
            default: "CENTER",
          },
        },
        buttonColor: {
          type: "TEXT",
        },
        borderRadius: {
          type: "TEXT",
        },
        boxShadow: {
          type: "TEXT",
        },
      },
      ENTITY_TYPE: "WIDGET",
      privateWidgets: {},
      propertyOverrideDependency: {},
      overridingPropertyPaths: {},
      type: "BUTTON_WIDGET",
      dynamicPropertyPathList: [
        {
          key: "onClick",
        },
      ],
      dynamicTriggerPathList: [
        {
          key: "onClick",
        },
      ],
      isMetaPropDirty: false,
      widgetId: "pzom2ufg3b",
    },
  } as ConfigTree;
  it("doesn't crash when config tree is empty", () => {
    const isADataField = isDataField("appsmith.store", {});
    expect(isADataField).toBe(false);
  });
  it("works correctly", function () {
    const testCases = [
      {
        fullPath: "Button1.text",
        isDataField: true,
      },
      {
        fullPath: "appsmith.store",
        isDataField: false,
      },
      {
        fullPath: "JSObject2.body",
        isDataField: false,
      },
    ];

    for (const testCase of testCases) {
      const isADataField = isDataField(testCase.fullPath, configTree);
      expect(isADataField).toBe(testCase.isDataField);
    }
  });
});
