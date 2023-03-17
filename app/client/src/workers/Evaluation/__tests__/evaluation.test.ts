import type {
  ConfigTree,
  WidgetEntity,
  UnEvalTree,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import type { WidgetTypeConfigMap } from "utils/WidgetFactory";
import { RenderModes } from "constants/WidgetConstants";
import { PluginType } from "entities/Action";
import DataTreeEvaluator from "workers/common/DataTreeEvaluator";
import { ValidationTypes } from "constants/WidgetValidation";
import WidgetFactory from "utils/WidgetFactory";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import { sortObjectWithArray } from "../../../utils/treeUtils";
import type { ActionEntityConfig, ActionEntity } from "entities/DataTree/types";

const WIDGET_CONFIG_MAP: WidgetTypeConfigMap = {
  CONTAINER_WIDGET: {
    defaultProperties: {},
    derivedProperties: {},
    metaProperties: {},
  },
  TEXT_WIDGET: {
    defaultProperties: {},
    derivedProperties: {
      value: "{{ this.text }}",
    },
    metaProperties: {},
  },
  BUTTON_WIDGET: {
    defaultProperties: {},
    derivedProperties: {},
    metaProperties: {},
  },
  INPUT_WIDGET_V2: {
    defaultProperties: {
      text: "defaultText",
    },
    derivedProperties: {
      isValid:
        '{{\n        function(){\n          let parsedRegex = null;\n          if (this.regex) {\n            /*\n            * break up the regexp pattern into 4 parts: given regex, regex prefix , regex pattern, regex flags\n            * Example /test/i will be split into ["/test/gi", "/", "test", "gi"]\n            */\n            const regexParts = this.regex.match(/(\\/?)(.+)\\1([a-z]*)/i);\n            if (!regexParts) {\n              parsedRegex = new RegExp(this.regex);\n            } else {\n              /*\n              * if we don\'t have a regex flags (gmisuy), convert provided string into regexp directly\n              /*\n              if (regexParts[3] && !/^(?!.*?(.).*?\\1)[gmisuy]+$/.test(regexParts[3])) {\n                parsedRegex = RegExp(this.regex);\n              }\n              /*\n              * if we have a regex flags, use it to form regexp\n              */\n              parsedRegex = new RegExp(regexParts[2], regexParts[3]);\n            }\n          }\n          if (this.inputType === "EMAIL") {\n            const emailRegex = new RegExp(/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/);\n            return emailRegex.test(this.text);\n          }\n          else if (this.inputType === "NUMBER") {\n            return !isNaN(this.text)\n          }\n          else if (this.isRequired) {\n            if(this.text && this.text.length) {\n              if (parsedRegex) {\n                return parsedRegex.test(this.text)\n              } else {\n                return true;\n              }\n            } else {\n              return false;\n            }\n          } if (parsedRegex) {\n            return parsedRegex.test(this.text)\n          } else {\n            return true;\n          }\n        }()\n      }}',
      value: "{{this.text}}",
    },
    metaProperties: {
      isFocused: false,
      isDirty: false,
    },
  },
  CHECKBOX_WIDGET: {
    defaultProperties: {
      isChecked: "defaultCheckedState",
    },
    derivedProperties: {
      value: "{{this.isChecked}}",
    },
    metaProperties: {},
  },
  SELECT_WIDGET: {
    defaultProperties: {
      selectedOption: "defaultOptionValue",
      filterText: "",
    },
    derivedProperties: {
      selectedOptionLabel: `{{_.isPlainObject(this.selectedOption) ? this.selectedOption?.label : this.selectedOption}}`,
      selectedOptionValue: `{{_.isPlainObject(this.selectedOption) ? this.selectedOption?.value : this.selectedOption}}`,
      isValid: `{{this.isRequired  ? !!this.selectedOptionValue || this.selectedOptionValue === 0 : true}}`,
    },
    metaProperties: {
      selectedOption: undefined,
      filterText: "",
    },
  },
  RADIO_GROUP_WIDGET: {
    defaultProperties: {
      selectedOptionValue: "defaultOptionValue",
    },
    derivedProperties: {
      selectedOption:
        "{{_.find(this.options, { value: this.selectedOptionValue })}}",
      isValid: "{{ this.isRequired ? !!this.selectedOptionValue : true }}",
      value: "{{this.selectedOptionValue}}",
    },
    metaProperties: {},
  },
  IMAGE_WIDGET: {
    defaultProperties: {},
    derivedProperties: {},
    metaProperties: {},
  },
  TABLE_WIDGET: {
    defaultProperties: {
      searchText: "defaultSearchText",
      selectedRowIndex: "defaultSelectedRow",
      selectedRowIndices: "defaultSelectedRow",
    },
    derivedProperties: {
      selectedRow: `{{ _.get(this.filteredTableData, this.selectedRowIndex, _.mapValues(this.filteredTableData[0], () => undefined)) }}`,
      selectedRows: `{{ this.filteredTableData.filter((item, i) => selectedRowIndices.includes(i) }); }}`,
    },
    metaProperties: {
      pageNo: 1,
      selectedRows: [],
    },
  },
  TABLE_WIDGET_V2: {
    defaultProperties: {
      searchText: "defaultSearchText",
      selectedRowIndex: "defaultSelectedRow",
      selectedRowIndices: "defaultSelectedRow",
    },
    derivedProperties: {
      selectedRow: `{{ _.get(this.filteredTableData, this.selectedRowIndex, _.mapValues(this.filteredTableData[0], () => undefined)) }}`,
      selectedRows: `{{ this.filteredTableData.filter((item, i) => selectedRowIndices.includes(i) }); }}`,
    },
    metaProperties: {
      pageNo: 1,
      selectedRow: {},
      selectedRows: [],
    },
  },
  VIDEO_WIDGET: {
    defaultProperties: {},
    derivedProperties: {},
    metaProperties: {
      playState: "NOT_STARTED",
    },
  },
  FILE_PICKER_WIDGET: {
    defaultProperties: {},
    derivedProperties: {
      isValid: "{{ this.isRequired ? this.files.length > 0 : true }}",
      value: "{{this.files}}",
    },
    metaProperties: {
      files: [],
      uploadedFileData: {},
    },
  },
  DATE_PICKER_WIDGET: {
    defaultProperties: {
      selectedDate: "defaultDate",
    },
    derivedProperties: {
      isValid: "{{ this.isRequired ? !!this.selectedDate : true }}",
      value: "{{ this.selectedDate }}",
    },
    metaProperties: {},
  },
  DATE_PICKER_WIDGET2: {
    defaultProperties: {
      selectedDate: "defaultDate",
    },
    derivedProperties: {
      isValid: "{{ this.isRequired ? !!this.selectedDate : true }}",
      value: "{{ this.selectedDate }}",
    },
    metaProperties: {},
  },
  TABS_WIDGET: {
    defaultProperties: {},
    derivedProperties: {
      selectedTab:
        "{{_.find(this.tabs, { widgetId: this.selectedTabWidgetId }).label}}",
    },
    metaProperties: {},
  },
  MODAL_WIDGET: {
    defaultProperties: {},
    derivedProperties: {},
    metaProperties: {},
  },
  RICH_TEXT_EDITOR_WIDGET: {
    defaultProperties: {
      text: "defaultText",
    },
    derivedProperties: {
      value: "{{this.text}}",
    },
    metaProperties: {},
  },
  CHART_WIDGET: {
    defaultProperties: {},
    derivedProperties: {},
    metaProperties: {},
  },
  FORM_WIDGET: {
    defaultProperties: {},
    derivedProperties: {},
    metaProperties: {},
  },
  FORM_BUTTON_WIDGET: {
    defaultProperties: {},
    derivedProperties: {},
    metaProperties: {},
  },
  MAP_WIDGET: {
    defaultProperties: {
      markers: "defaultMarkers",
      center: "mapCenter",
    },
    derivedProperties: {},
    metaProperties: {},
  },
  CANVAS_WIDGET: {
    defaultProperties: {},
    derivedProperties: {},
    metaProperties: {},
  },
  ICON_WIDGET: {
    defaultProperties: {},
    derivedProperties: {},
    metaProperties: {},
  },
  SKELETON_WIDGET: {
    defaultProperties: {},
    derivedProperties: {},
    metaProperties: {},
  },
};

const BASE_WIDGET = {
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
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
  meta: {},
} as unknown as WidgetEntity;

const BASE_WIDGET_CONFIG = {
  logBlackList: {},
  widgetId: "randomID",
  type: "SKELETON_WIDGET",
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
} as unknown as WidgetEntityConfig;

export const BASE_ACTION: ActionEntity = {
  clear: {},
  actionId: "randomId",
  datasourceUrl: "",
  config: {
    timeoutInMillisecond: 10,
  },
  isLoading: false,
  run: {},
  data: {},
  responseMeta: { isExecutionSuccess: false },
  ENTITY_TYPE: ENTITY_TYPE.ACTION,
};
export const BASE_ACTION_CONFIG: ActionEntityConfig = {
  actionId: "randomId",
  logBlackList: {},
  pluginId: "",
  name: "randomActionName",
  dynamicBindingPathList: [],
  pluginType: PluginType.API,
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
  "Dropdown1.isValid": ["Dropdown1.selectedOptionValue"],
  "Dropdown1.filterText": ["Dropdown1.meta.filterText"],
  "Dropdown1.meta": [
    "Dropdown1.meta.filterText",
    "Dropdown1.meta.selectedOption",
  ],
  "Dropdown1.selectedOption": [
    "Dropdown1.defaultOptionValue",
    "Dropdown1.meta.selectedOption",
  ],
  "Dropdown1.selectedOptionLabel": ["Dropdown1.selectedOption"],
  "Dropdown1.selectedOptionValue": ["Dropdown1.selectedOption"],
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
  "Text3.text": ["Text1.text"],
  Text4: ["Text4.text", "Text4.value"],
  "Text4.text": ["Table1.selectedRow"],
  "Text4.value": ["Text4.text"],
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
  //Input1
  const { configEntity, unEvalEntity } = generateDataTreeWidget(
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
  const input1unEvalEntity = unEvalEntity;
  const input1ConfigEntity = configEntity;
  //Text1

  const unEvalTree: UnEvalTree = {
    Text1: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        widgetName: "Text1",
        text: "Label",
        type: "TEXT_WIDGET",
      },
      {},
    ).unEvalEntity,
    Text2: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        widgetName: "Text2",
        text: "{{Text1.text}}",
        dynamicBindingPathList: [{ key: "text" }],
        type: "TEXT_WIDGET",
      },
      {},
    ).unEvalEntity,
    Text3: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        widgetName: "Text3",
        text: "{{Text1.text}}",
        dynamicBindingPathList: [{ key: "text" }],
        type: "TEXT_WIDGET",
      },
      {},
    ).unEvalEntity,
    Dropdown1: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        widgetName: "Dropdown1",
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
    ).unEvalEntity,
    Table1: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        widgetName: "Table1",
        tableData:
          "{{Api1.data.map(datum => ({ ...datum, raw: Text1.text }) )}}",
        dynamicBindingPathList: [{ key: "tableData" }],
        type: "TABLE_WIDGET",
      },
      {},
    ).unEvalEntity,
    Text4: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        text: "{{Table1.selectedRow.test}}",
        widgetName: "Text4",
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
    ).unEvalEntity,
  };

  const configTree: ConfigTree = {
    Text1: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        widgetName: "Text1",
        text: "Label",
        type: "TEXT_WIDGET",
      },
      {},
    ).configEntity,
    Text2: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        widgetName: "Text2",
        text: "{{Text1.text}}",
        dynamicBindingPathList: [{ key: "text" }],
        type: "TEXT_WIDGET",
      },
      {},
    ).configEntity,
    Text3: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        widgetName: "Text3",
        text: "{{Text1.text}}",
        dynamicBindingPathList: [{ key: "text" }],
        type: "TEXT_WIDGET",
      },
      {},
    ).configEntity,
    Dropdown1: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        widgetName: "Dropdown1",
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
    ).configEntity,
    Table1: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        widgetName: "Table1",
        tableData:
          "{{Api1.data.map(datum => ({ ...datum, raw: Text1.text }) )}}",
        dynamicBindingPathList: [{ key: "tableData" }],
        type: "TABLE_WIDGET",
      },
      {},
    ).configEntity,
    Text4: generateDataTreeWidget(
      {
        ...BASE_WIDGET_CONFIG,
        ...BASE_WIDGET,
        widgetName: "Text4",
        text: "{{Table1.selectedRow.test}}",
        dynamicBindingPathList: [{ key: "text" }],
        type: "TEXT_WIDGET",
        reactivePaths: {
          text: EvaluationSubstitutionType.TEMPLATE,
        },
        validationPaths: {
          text: { type: ValidationTypes.TEXT },
        },
        dynamicTriggerPathList: [],
      },
      {},
    ).configEntity,
  };

  const evaluator = new DataTreeEvaluator(WIDGET_CONFIG_MAP);
  evaluator.setupFirstTree(unEvalTree, configTree);
  evaluator.evalAndValidateFirstTree();
  it("Evaluates a binding in first run", () => {
    const evaluation = evaluator.evalTree;
    const dependencyMap = evaluator.dependencyMap;
    expect(evaluation).toHaveProperty("Text2.text", "Label");
    expect(evaluation).toHaveProperty("Text3.text", "Label");
    expect(sortObjectWithArray(dependencyMap)).toStrictEqual(dependencyMap);
  });

  it("Evaluates a value change in update run", () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Text1: {
        ...unEvalTree.Text1,
        text: "Hey there",
      },
    };
    const updatedConfigTree = {
      ...configTree,
      Text: {
        ...configTree.Text1,
      },
    };
    const { evalOrder, nonDynamicFieldValidationOrder, unEvalUpdates } =
      evaluator.setupUpdateTree(updatedUnEvalTree, updatedConfigTree);
    evaluator.evalAndValidateSubTree(
      evalOrder,
      nonDynamicFieldValidationOrder,
      updatedConfigTree,
      unEvalUpdates,
    );
    const dataTree = evaluator.evalTree;
    expect(dataTree).toHaveProperty("Text2.text", "Hey there");
    expect(dataTree).toHaveProperty("Text3.text", "Hey there");
  });

  it("Evaluates a dependency change in update run", () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Text3: {
        ...unEvalTree.Text3,
        text: "Label 3",
      },
    };
    const updatedConfigTree = {
      ...configTree,
      Text3: {
        ...configTree.Text3,
        dynamicBindingPathList: [],
      },
    };

    const { evalOrder, nonDynamicFieldValidationOrder, unEvalUpdates } =
      evaluator.setupUpdateTree(updatedUnEvalTree, updatedConfigTree);
    evaluator.evalAndValidateSubTree(
      evalOrder,
      nonDynamicFieldValidationOrder,
      updatedConfigTree,
      unEvalUpdates,
    );

    const dataTree = evaluator.evalTree;
    const updatedDependencyMap = evaluator.dependencyMap;
    expect(dataTree).toHaveProperty("Text2.text", "Label");
    expect(dataTree).toHaveProperty("Text3.text", "Label 3");

    expect(sortObjectWithArray(updatedDependencyMap)).toStrictEqual(
      dependencyMap,
    );
  });

  it("Overrides with default value", () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Input1: input1unEvalEntity,
    };

    const updatedConfigTree = {
      ...configTree,
      Input1: input1ConfigEntity,
    };

    const { evalOrder, nonDynamicFieldValidationOrder, unEvalUpdates } =
      evaluator.setupUpdateTree(updatedUnEvalTree, updatedConfigTree);
    evaluator.evalAndValidateSubTree(
      evalOrder,
      nonDynamicFieldValidationOrder,
      updatedConfigTree,
      unEvalUpdates,
    );
    const dataTree = evaluator.evalTree;
    expect(dataTree).toHaveProperty("Input1.text", "Default value");
  });

  it("Evaluates for value changes in nested diff paths", () => {
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
        widgetName: "Dropdown2",
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
      },
    } as unknown as UnEvalTree;

    const updatedConfigTree = {
      ...configTree,
      Dropdown2: {
        ...BASE_WIDGET_CONFIG,
        type: "SELECT_WIDGET",
        bindingPaths,
        reactivePaths: {
          ...bindingPaths,
          isValid: EvaluationSubstitutionType.TEMPLATE,
          selectedOption: EvaluationSubstitutionType.TEMPLATE,
          selectedOptionValue: EvaluationSubstitutionType.TEMPLATE,
          selectedOptionLabel: EvaluationSubstitutionType.TEMPLATE,
        },
        propertyOverrideDependency: {},
        validationPaths: {},
      },
    } as unknown as ConfigTree;

    const { evalOrder, nonDynamicFieldValidationOrder, unEvalUpdates } =
      evaluator.setupUpdateTree(updatedUnEvalTree, updatedConfigTree);

    evaluator.evalAndValidateSubTree(
      evalOrder,
      nonDynamicFieldValidationOrder,
      updatedConfigTree,
      unEvalUpdates,
    );
    const dataTree = evaluator.evalTree;
    expect(dataTree).toHaveProperty("Dropdown2.options.0.label", "newValue");
  });

  it("Adds an entity with a complicated binding", () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Api1: {
        ...BASE_ACTION,
        data: [
          {
            test: "Hey",
          },
          {
            test: "Ho",
          },
        ],
      },
    } as unknown as UnEvalTree;
    const updatedConfigTree = {
      ...configTree,
      Api1: {
        ...BASE_ACTION_CONFIG,
        name: "Api1",
      },
    } as unknown as ConfigTree;

    const { evalOrder, nonDynamicFieldValidationOrder, unEvalUpdates } =
      evaluator.setupUpdateTree(updatedUnEvalTree, updatedConfigTree);

    evaluator.evalAndValidateSubTree(
      evalOrder,
      nonDynamicFieldValidationOrder,
      updatedConfigTree,
      unEvalUpdates,
    );
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

  it("Selects a row", () => {
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
        data: [
          {
            test: "Hey",
          },
          {
            test: "Ho",
          },
        ],
      },
    } as unknown as UnEvalTree;
    const updatedConfigTree = {
      ...configTree,
      Table1: {
        ...configTree.Table1,
      },
      Api1: {
        ...BASE_ACTION_CONFIG,
        name: "Api1",
      },
    } as unknown as ConfigTree;

    const { evalOrder, nonDynamicFieldValidationOrder, unEvalUpdates } =
      evaluator.setupUpdateTree(updatedUnEvalTree, updatedConfigTree);

    evaluator.evalAndValidateSubTree(
      evalOrder,
      nonDynamicFieldValidationOrder,
      updatedConfigTree,
      unEvalUpdates,
    );
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

  it("Honors predefined action dependencyMap", () => {
    const updatedTree1 = {
      ...unEvalTree,
      Text1: {
        ...unEvalTree.Text1,
        text: "Test",
      },
      Api2: {
        ...BASE_ACTION,
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
    const updatedConfigTree1 = {
      ...configTree,
      Text1: {
        ...configTree.Text1,
      },
      Api2: {
        ...BASE_ACTION_CONFIG,
        name: "Api2",
        dependencyMap: {
          "config.body": ["config.pluginSpecifiedTemplates[0].value"],
        },
        reactivePaths: {
          ...BASE_ACTION_CONFIG.reactivePaths,
          "config.body": EvaluationSubstitutionType.TEMPLATE,
        },
      },
    } as unknown as ConfigTree;

    const {
      evalOrder,
      nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder2,
      unEvalUpdates,
    } = evaluator.setupUpdateTree(updatedTree1, updatedConfigTree1);
    evaluator.evalAndValidateSubTree(
      evalOrder,
      nonDynamicFieldValidationOrder2,
      updatedConfigTree1,
      unEvalUpdates,
    );
    expect(evaluator.dependencyMap["Api2.config.body"]).toStrictEqual([
      "Api2.config.pluginSpecifiedTemplates[0].value",
    ]);
    const updatedTree2 = {
      ...updatedTree1,
      Api2: {
        ...updatedTree1.Api2,
        config: {
          ...updatedTree1.Api2.config,
          body: "{ 'name': {{ Text1.text }} }",
        },
      },
    };

    const updatedConfigTree2 = {
      ...updatedConfigTree1,
      Api2: {
        ...updatedConfigTree1.Api2,
        dynamicBindingPathList: [
          {
            key: "config.body",
          },
        ],
      },
    };

    const {
      evalOrder: newEvalOrder,
      nonDynamicFieldValidationOrder,
      unEvalUpdates: unEvalUpdates2,
    } = evaluator.setupUpdateTree(updatedTree2, updatedConfigTree2);
    evaluator.evalAndValidateSubTree(
      newEvalOrder,
      nonDynamicFieldValidationOrder,
      updatedConfigTree2,
      unEvalUpdates2,
    );
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
    const updatedConfigTree3 = {
      ...updatedConfigTree2,
      Api2: {
        ...updatedConfigTree2.Api2,
        reactivePaths: {
          ...updatedConfigTree2.Api2.reactivePaths,
          "config.body": EvaluationSubstitutionType.SMART_SUBSTITUTE,
        },
      },
    };

    const {
      evalOrder: newEvalOrder2,
      nonDynamicFieldValidationOrder: nonDynamicFieldValidationOrder3,
      unEvalUpdates: unEvalUpdates3,
    } = evaluator.setupUpdateTree(updatedTree3, updatedConfigTree3);
    evaluator.evalAndValidateSubTree(
      newEvalOrder2,
      nonDynamicFieldValidationOrder3,
      updatedConfigTree3,
      unEvalUpdates3,
    );
    const dataTree3 = evaluator.evalTree;
    expect(evaluator.dependencyMap["Api2.config.body"]).toStrictEqual([
      "Text1.text",
      "Api2.config.pluginSpecifiedTemplates[0].value",
    ]);
    // @ts-expect-error: Types are not available
    expect(dataTree3.Api2.config.body).toBe("{ 'name': \"Test\" }");
  });
});
