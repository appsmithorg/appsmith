import {
  DataTreeAction,
  DataTreeWidget,
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import { RenderModes } from "constants/WidgetConstants";
import { PluginType } from "entities/Action";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import { ValidationTypes } from "constants/WidgetValidation";
import WidgetFactory from "utils/WidgetFactory";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import { sortObjectWithArray } from "../utils/treeUtils";
import { WIDGET_CONFIG_MAP } from "./__tests__/evaluation.mockData";

// @ts-expect-error: meta is required
const BASE_WIDGET: DataTreeWidget = {
  logBlackList: {},
  widgetId: "randomID",
  widgetName: "randomWidgetName",
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: "SKELETON_WIDGET",
  parentId: "0",
  version: 1,
  bindingPaths: {},
  reactivePaths: {},
  triggerPaths: {},
  validationPaths: {},
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
  propertyOverrideDependency: {},
  overridingPropertyPaths: {},
  privateWidgets: {},
};

const BASE_ACTION: DataTreeAction = {
  clear: {},
  logBlackList: {},
  actionId: "randomId",
  pluginId: "",
  name: "randomActionName",
  datasourceUrl: "",
  config: {
    timeoutInMillisecond: 10,
  },
  dynamicBindingPathList: [],
  isLoading: false,
  pluginType: PluginType.API,
  run: {},
  data: {},
  responseMeta: { isExecutionSuccess: false },
  ENTITY_TYPE: ENTITY_TYPE.ACTION,
  bindingPaths: {},
  reactivePaths: {
    isLoading: EvaluationSubstitutionType.TEMPLATE,
    data: EvaluationSubstitutionType.TEMPLATE,
  },
  dependencyMap: {},
};

const metaMock = jest.spyOn(WidgetFactory, "getWidgetMetaPropertiesMap");

const mockDefault = jest.spyOn(WidgetFactory, "getWidgetDefaultPropertiesMap");

const mockDerived = jest.spyOn(WidgetFactory, "getWidgetDerivedPropertiesMap");

const dependencyMap = {
  Dropdown1: [
    "Dropdown1.defaultOptionValue",
    "Dropdown1.filterText",
    "Dropdown1.isValid",
    "Dropdown1.meta",
    "Dropdown1.selectedOption",
    "Dropdown1.selectedOptionLabel",
    "Dropdown1.selectedOptionValue",
  ],
  "Dropdown1.isValid": [],
  "Dropdown1.filterText": ["Dropdown1.meta.filterText"],
  "Dropdown1.meta": [
    "Dropdown1.meta.filterText",
    "Dropdown1.meta.selectedOption",
  ],
  "Dropdown1.selectedOption": [
    "Dropdown1.defaultOptionValue",
    "Dropdown1.meta.selectedOption",
  ],
  "Dropdown1.selectedOptionLabel": [],
  "Dropdown1.selectedOptionValue": [],
  Table1: [
    "Table1.defaultSearchText",
    "Table1.defaultSelectedRow",
    "Table1.searchText",
    "Table1.selectedRow",
    "Table1.selectedRowIndex",
    "Table1.selectedRowIndices",
    "Table1.selectedRows",
    "Table1.tableData",
  ],
  "Table1.searchText": ["Table1.defaultSearchText"],
  "Table1.selectedRow": [],
  "Table1.selectedRowIndex": ["Table1.defaultSelectedRow"],
  "Table1.selectedRowIndices": ["Table1.defaultSelectedRow"],
  "Table1.selectedRows": [],
  "Table1.tableData": ["Text1.text"],
  Text1: ["Text1.text", "Text1.value"],
  "Text1.value": ["Text1.text"],
  Text2: ["Text2.text", "Text2.value"],
  "Text2.text": ["Text1.text"],
  "Text2.value": ["Text2.text"],
  Text3: ["Text3.text", "Text3.value"],
  "Text3.value": ["Text3.text"],
  Text4: ["Text4.text", "Text4.value"],
  "Text4.text": ["Table1.selectedRow"],
  "Text4.value": [],
};

describe("DataTreeEvaluator", () => {
  metaMock.mockImplementation((type) => {
    return WIDGET_CONFIG_MAP[type].metaProperties;
  });
  mockDefault.mockImplementation((type) => {
    return WIDGET_CONFIG_MAP[type].defaultProperties;
  });
  mockDerived.mockImplementation((type) => {
    return WIDGET_CONFIG_MAP[type].derivedProperties;
  });
  const Input1 = generateDataTreeWidget(
    {
      ...BASE_WIDGET,
      text: undefined,
      defaultText: "Default value",
      widgetName: "Input1",
      type: "INPUT_WIDGET_V2",
      reactivePaths: {
        defaultText: EvaluationSubstitutionType.TEMPLATE,
        isValid: EvaluationSubstitutionType.TEMPLATE,
        value: EvaluationSubstitutionType.TEMPLATE,
        text: EvaluationSubstitutionType.TEMPLATE,
      },
    },
    {},
  );
  const unEvalTree: Record<string, DataTreeWidget> = {
    Text1: generateDataTreeWidget(
      {
        ...BASE_WIDGET,
        widgetName: "Text1",
        text: "Label",
        type: "TEXT_WIDGET",
      },
      {},
    ),
    Text2: generateDataTreeWidget(
      {
        ...BASE_WIDGET,
        widgetName: "Text2",
        text: "{{Text1.text}}",
        dynamicBindingPathList: [{ key: "text" }],
        type: "TEXT_WIDGET",
      },
      {},
    ),
    Text3: generateDataTreeWidget(
      {
        ...BASE_WIDGET,
        widgetName: "Text3",
        text: "{{Text1.text}}",
        dynamicBindingPathList: [{ key: "text" }],
        type: "TEXT_WIDGET",
      },
      {},
    ),
    Dropdown1: generateDataTreeWidget(
      {
        ...BASE_WIDGET,
        options: [
          {
            label: "test",
            value: "valueTest",
          },
          {
            label: "test2",
            value: "valueTest2",
          },
        ],
        type: "SELECT_WIDGET",
      },
      {},
    ),
    Table1: generateDataTreeWidget(
      {
        ...BASE_WIDGET,
        tableData:
          "{{Api1.data.map(datum => ({ ...datum, raw: Text1.text }) )}}",
        dynamicBindingPathList: [{ key: "tableData" }],
        type: "TABLE_WIDGET",
      },
      {},
    ),
    Text4: generateDataTreeWidget(
      {
        ...BASE_WIDGET,
        text: "{{Table1.selectedRow.test}}",
        dynamicBindingPathList: [{ key: "text" }],
        type: "TEXT_WIDGET",
        reactivePaths: {
          text: EvaluationSubstitutionType.TEMPLATE,
        },
        validationPaths: {
          text: { type: ValidationTypes.TEXT },
        },
      },
      {},
    ),
  };
  let evaluator: DataTreeEvaluator;
  it("Evaluates a binding in first run", async () => {
    evaluator = new DataTreeEvaluator(WIDGET_CONFIG_MAP);
    await evaluator.createFirstTree(unEvalTree);
    const evaluation = evaluator.evalTree;
    const dependencyMap = evaluator.dependencyMap;

    expect(evaluation).toHaveProperty("Text2.text", "Label");
    expect(evaluation).toHaveProperty("Text3.text", "Label");
    expect(sortObjectWithArray(dependencyMap)).toStrictEqual(dependencyMap);
  });

  it("Evaluates a value change in update run", async () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Text1: {
        ...unEvalTree.Text1,
        text: "Hey there",
      },
    };
    await evaluator.updateDataTree(updatedUnEvalTree);
    const dataTree = evaluator.evalTree;
    expect(dataTree).toHaveProperty("Text2.text", "Hey there");
    expect(dataTree).toHaveProperty("Text3.text", "Hey there");
  });

  it("Evaluates a dependency change in update run", async () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Text3: {
        ...unEvalTree.Text3,
        text: "Label 3",
      },
    };
    await evaluator.updateDataTree(updatedUnEvalTree);
    const dataTree = evaluator.evalTree;
    const updatedDependencyMap = evaluator.dependencyMap;
    expect(dataTree).toHaveProperty("Text2.text", "Label");
    expect(dataTree).toHaveProperty("Text3.text", "Label 3");

    expect(sortObjectWithArray(updatedDependencyMap)).toStrictEqual(
      dependencyMap,
    );
  });

  it("Overrides with default value", async () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Input1,
    };

    await evaluator.updateDataTree(updatedUnEvalTree);
    const dataTree = evaluator.evalTree;
    expect(dataTree).toHaveProperty("Input1.text", "Default value");
  });

  it("Evaluates for value changes in nested diff paths", async () => {
    const bindingPaths = {
      options: EvaluationSubstitutionType.TEMPLATE,
      defaultOptionValue: EvaluationSubstitutionType.TEMPLATE,
      isRequired: EvaluationSubstitutionType.TEMPLATE,
      isVisible: EvaluationSubstitutionType.TEMPLATE,
      isDisabled: EvaluationSubstitutionType.TEMPLATE,
    };
    const updatedUnEvalTree = {
      ...unEvalTree,
      Dropdown2: {
        ...BASE_WIDGET,
        options: [
          {
            label: "newValue",
            value: "valueTest",
          },
          {
            label: "test2",
            value: "valueTest2",
          },
        ],
        type: "SELECT_WIDGET",
        bindingPaths,
        reactivePaths: {
          ...bindingPaths,
          isValid: EvaluationSubstitutionType.TEMPLATE,
          selectedOption: EvaluationSubstitutionType.TEMPLATE,
          selectedOptionValue: EvaluationSubstitutionType.TEMPLATE,
          selectedOptionLabel: EvaluationSubstitutionType.TEMPLATE,
        },
      },
    };
    await evaluator.updateDataTree(updatedUnEvalTree);
    const dataTree = evaluator.evalTree;
    expect(dataTree).toHaveProperty("Dropdown2.options.0.label", "newValue");
  });

  it("Adds an entity with a complicated binding", async () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Api1: {
        ...BASE_ACTION,
        name: "Api1",
        data: [
          {
            test: "Hey",
          },
          {
            test: "Ho",
          },
        ],
      },
    };
    await evaluator.updateDataTree(updatedUnEvalTree);
    const dataTree = evaluator.evalTree;
    const updatedDependencyMap = evaluator.dependencyMap;
    expect(dataTree).toHaveProperty("Table1.tableData", [
      {
        test: "Hey",
        raw: "Label",
      },
      {
        test: "Ho",
        raw: "Label",
      },
    ]);

    expect(sortObjectWithArray(updatedDependencyMap)).toStrictEqual({
      Api1: ["Api1.data"],
      ...dependencyMap,
      "Table1.tableData": ["Api1.data", "Text1.text"],
      "Text3.text": ["Text1.text"],
    });
  });

  it("Selects a row", async () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Table1: {
        ...unEvalTree.Table1,
        selectedRowIndex: 0,
        selectedRow: {
          test: "Hey",
          raw: "Label",
        },
      },
      Api1: {
        ...BASE_ACTION,
        name: "Api1",
        data: [
          {
            test: "Hey",
          },
          {
            test: "Ho",
          },
        ],
      },
    };
    await evaluator.updateDataTree(updatedUnEvalTree);
    const dataTree = evaluator.evalTree;
    const updatedDependencyMap = evaluator.dependencyMap;
    expect(dataTree).toHaveProperty("Table1.tableData", [
      {
        test: "Hey",
        raw: "Label",
      },
      {
        test: "Ho",
        raw: "Label",
      },
    ]);
    expect(dataTree).toHaveProperty("Text4.text", "Hey");
    expect(sortObjectWithArray(updatedDependencyMap)).toStrictEqual({
      Api1: ["Api1.data"],
      ...dependencyMap,
      "Table1.tableData": ["Api1.data", "Text1.text"],
      "Text3.text": ["Text1.text"],
    });
  });

  it("Honors predefined action dependencyMap", async () => {
    const updatedTree1 = {
      ...unEvalTree,
      Text1: {
        ...BASE_WIDGET,
        text: "Test",
      },
      Api2: {
        ...BASE_ACTION,
        dependencyMap: {
          "config.body": ["config.pluginSpecifiedTemplates[0].value"],
        },
        reactivePaths: {
          ...BASE_ACTION.reactivePaths,
          "config.body": EvaluationSubstitutionType.TEMPLATE,
        },
        config: {
          ...BASE_ACTION.config,
          body: "",
          pluginSpecifiedTemplates: [
            {
              value: false,
            },
          ],
        },
      },
    };
    await evaluator.updateDataTree(updatedTree1);
    expect(evaluator.dependencyMap["Api2.config.body"]).toStrictEqual([
      "Api2.config.pluginSpecifiedTemplates[0].value",
    ]);
    const updatedTree2 = {
      ...updatedTree1,
      Api2: {
        ...updatedTree1.Api2,
        dynamicBindingPathList: [
          {
            key: "config.body",
          },
        ],
        config: {
          ...updatedTree1.Api2.config,
          body: "{ 'name': {{ Text1.text }} }",
        },
      },
    };
    await evaluator.updateDataTree(updatedTree2);
    const dataTree = evaluator.evalTree;
    expect(evaluator.dependencyMap["Api2.config.body"]).toStrictEqual([
      "Text1.text",
      "Api2.config.pluginSpecifiedTemplates[0].value",
    ]);
    // @ts-expect-error: Types are not available
    expect(dataTree.Api2.config.body).toBe("{ 'name': Test }");
    const updatedTree3 = {
      ...updatedTree2,
      Api2: {
        ...updatedTree2.Api2,
        reactivePaths: {
          ...updatedTree2.Api2.reactivePaths,
          "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
        },
        config: {
          ...updatedTree2.Api2.config,
          pluginSpecifiedTemplates: [
            {
              value: true,
            },
          ],
        },
      },
    };
    await evaluator.updateDataTree(updatedTree3);
    const dataTree3 = evaluator.evalTree;
    expect(evaluator.dependencyMap["Api2.config.body"]).toStrictEqual([
      "Text1.text",
      "Api2.config.pluginSpecifiedTemplates[0].value",
    ]);
    // @ts-expect-error: Types are not available
    expect(dataTree3.Api2.config.body).toBe("{ 'name': \"Test\" }");
  });
});
