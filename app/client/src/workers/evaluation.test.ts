import {
  DataTreeAction,
  DataTreeWidget,
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "../entities/DataTree/dataTreeFactory";
import { WidgetTypeConfigMap } from "../utils/WidgetFactory";
import { RenderModes } from "../constants/WidgetConstants";
import { PluginType } from "../entities/Action";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import { ValidationTypes } from "constants/WidgetValidation";

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
  INPUT_WIDGET: {
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
  DROP_DOWN_WIDGET: {
    defaultProperties: {
      selectedOptionValue: "defaultOptionValue",
      selectedOptionValueArr: "defaultOptionValue",
    },
    derivedProperties: {
      isValid:
        "{{this.isRequired ? this.selectionType === 'SINGLE_SELECT' ? !!this.selectedOption : !!this.selectedIndexArr && this.selectedIndexArr.length > 0 : true}}",
      selectedOption:
        "{{ this.selectionType === 'SINGLE_SELECT' ? _.find(this.options, { value:  this.selectedOptionValue }) : undefined}}",
      selectedOptionArr:
        '{{this.selectionType === "MULTI_SELECT" ? this.options.filter(opt => _.includes(this.selectedOptionValueArr, opt.value)) : undefined}}',
      selectedIndex:
        "{{ _.findIndex(this.options, { value: this.selectedOption.value } ) }}",
      selectedIndexArr:
        "{{ this.selectedOptionValueArr.map(o => _.findIndex(this.options, { value: o })) }}",
      value:
        "{{ this.selectionType === 'SINGLE_SELECT' ? this.selectedOptionValue : this.selectedOptionValueArr }}",
      selectedOptionValues: "{{ this.selectedOptionValueArr }}",
    },
    metaProperties: {},
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
  triggerPaths: {},
  validationPaths: {},
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
};

const BASE_ACTION: DataTreeAction = {
  logBlackList: {},
  actionId: "randomId",
  name: "randomActionName",
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
  bindingPaths: {
    isLoading: EvaluationSubstitutionType.TEMPLATE,
    data: EvaluationSubstitutionType.TEMPLATE,
  },
  dependencyMap: {},
};

describe("DataTreeEvaluator", () => {
  const unEvalTree: Record<string, DataTreeWidget> = {
    Text1: {
      ...BASE_WIDGET,
      widgetName: "Text1",
      text: "Label",
      type: "TEXT_WIDGET",
      bindingPaths: {
        text: EvaluationSubstitutionType.TEMPLATE,
      },
      validationPaths: {
        text: { type: ValidationTypes.TEXT },
      },
    },
    Text2: {
      ...BASE_WIDGET,
      widgetName: "Text2",
      text: "{{Text1.text}}",
      dynamicBindingPathList: [{ key: "text" }],
      type: "TEXT_WIDGET",
      bindingPaths: {
        text: EvaluationSubstitutionType.TEMPLATE,
      },
      validationPaths: {
        text: { type: ValidationTypes.TEXT },
      },
    },
    Text3: {
      ...BASE_WIDGET,
      widgetName: "Text3",
      text: "{{Text1.text}}",
      dynamicBindingPathList: [{ key: "text" }],
      type: "TEXT_WIDGET",
      bindingPaths: {
        text: EvaluationSubstitutionType.TEMPLATE,
      },
      validationPaths: {
        text: { type: ValidationTypes.TEXT },
      },
    },
    Dropdown1: {
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
      type: "DROP_DOWN_WIDGET",
      bindingPaths: {
        options: EvaluationSubstitutionType.TEMPLATE,
        defaultOptionValue: EvaluationSubstitutionType.TEMPLATE,
        isRequired: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        isDisabled: EvaluationSubstitutionType.TEMPLATE,
        isValid: EvaluationSubstitutionType.TEMPLATE,
        selectedOption: EvaluationSubstitutionType.TEMPLATE,
        selectedOptionArr: EvaluationSubstitutionType.TEMPLATE,
        selectedIndex: EvaluationSubstitutionType.TEMPLATE,
        selectedIndexArr: EvaluationSubstitutionType.TEMPLATE,
        value: EvaluationSubstitutionType.TEMPLATE,
        selectedOptionValues: EvaluationSubstitutionType.TEMPLATE,
      },
    },
    Table1: {
      ...BASE_WIDGET,
      tableData: "{{Api1.data.map(datum => ({ ...datum, raw: Text1.text }) )}}",
      dynamicBindingPathList: [{ key: "tableData" }],
      type: "TABLE_WIDGET",
      bindingPaths: {
        tableData: EvaluationSubstitutionType.TEMPLATE,
        selectedRow: EvaluationSubstitutionType.TEMPLATE,
        selectedRows: EvaluationSubstitutionType.TEMPLATE,
      },
      validationPaths: {
        tableData: { type: ValidationTypes.OBJECT_ARRAY },
      },
    },
    Text4: {
      ...BASE_WIDGET,
      text: "{{Table1.selectedRow.test}}",
      dynamicBindingPathList: [{ key: "text" }],
      type: "TEXT_WIDGET",
      bindingPaths: {
        text: EvaluationSubstitutionType.TEMPLATE,
      },
      validationPaths: {
        text: { type: ValidationTypes.TEXT },
      },
    },
  };
  const evaluator = new DataTreeEvaluator(WIDGET_CONFIG_MAP);
  evaluator.createFirstTree(unEvalTree);
  it("Evaluates a binding in first run", () => {
    const evaluation = evaluator.evalTree;
    const dependencyMap = evaluator.dependencyMap;

    expect(evaluation).toHaveProperty("Text2.text", "Label");
    expect(evaluation).toHaveProperty("Text3.text", "Label");
    expect(dependencyMap).toStrictEqual({
      Text1: ["Text1.text"],
      Text2: ["Text2.text"],
      Text3: ["Text3.text"],
      Text4: ["Text4.text"],
      Table1: [
        "Table1.tableData",
        "Table1.searchText",
        "Table1.selectedRowIndex",
        "Table1.selectedRowIndices",
      ],
      Dropdown1: [
        "Dropdown1.selectedOptionValue",
        "Dropdown1.selectedOptionValueArr",
      ],
      "Text2.text": ["Text1.text"],
      "Text3.text": ["Text1.text"],
      "Dropdown1.selectedOptionValue": [],
      "Dropdown1.selectedOptionValueArr": [],
      "Table1.tableData": ["Text1.text"],
      "Table1.searchText": [],
      "Table1.selectedRowIndex": [],
      "Table1.selectedRowIndices": [],
      "Text4.text": [],
    });
  });

  it("Evaluates a value change in update run", () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Text1: {
        ...unEvalTree.Text1,
        text: "Hey there",
      },
    };
    evaluator.updateDataTree(updatedUnEvalTree);
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
    evaluator.updateDataTree(updatedUnEvalTree);
    const dataTree = evaluator.evalTree;
    const updatedDependencyMap = evaluator.dependencyMap;
    expect(dataTree).toHaveProperty("Text2.text", "Label");
    expect(dataTree).toHaveProperty("Text3.text", "Label 3");
    expect(updatedDependencyMap).toStrictEqual({
      Text1: ["Text1.text"],
      Text2: ["Text2.text"],
      Text3: ["Text3.text"],
      Text4: ["Text4.text"],
      Table1: [
        "Table1.tableData",
        "Table1.searchText",
        "Table1.selectedRowIndex",
        "Table1.selectedRowIndices",
      ],
      Dropdown1: [
        "Dropdown1.selectedOptionValue",
        "Dropdown1.selectedOptionValueArr",
      ],
      "Text2.text": ["Text1.text"],
      "Dropdown1.selectedOptionValue": [],
      "Dropdown1.selectedOptionValueArr": [],
      "Table1.tableData": ["Text1.text"],
      "Table1.searchText": [],
      "Table1.selectedRowIndex": [],
      "Table1.selectedRowIndices": [],
      "Text4.text": [],
    });
  });

  it("Overrides with default value", () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Input1: {
        ...BASE_WIDGET,
        text: undefined,
        defaultText: "Default value",
        widgetName: "Input1",
        type: "INPUT_WIDGET",
        bindingPaths: {
          defaultText: EvaluationSubstitutionType.TEMPLATE,
          isValid: EvaluationSubstitutionType.TEMPLATE,
          value: EvaluationSubstitutionType.TEMPLATE,
          text: EvaluationSubstitutionType.TEMPLATE,
        },
      },
    };

    evaluator.updateDataTree(updatedUnEvalTree);
    const dataTree = evaluator.evalTree;
    expect(dataTree).toHaveProperty("Input1.text", "Default value");
  });

  it("Evaluates for value changes in nested diff paths", () => {
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
        type: "DROP_DOWN_WIDGET",
        bindingPaths: {
          options: EvaluationSubstitutionType.TEMPLATE,
          defaultOptionValue: EvaluationSubstitutionType.TEMPLATE,
          isRequired: EvaluationSubstitutionType.TEMPLATE,
          isVisible: EvaluationSubstitutionType.TEMPLATE,
          isDisabled: EvaluationSubstitutionType.TEMPLATE,
          isValid: EvaluationSubstitutionType.TEMPLATE,
          selectedOption: EvaluationSubstitutionType.TEMPLATE,
          selectedOptionArr: EvaluationSubstitutionType.TEMPLATE,
          selectedIndex: EvaluationSubstitutionType.TEMPLATE,
          selectedIndexArr: EvaluationSubstitutionType.TEMPLATE,
          value: EvaluationSubstitutionType.TEMPLATE,
          selectedOptionValues: EvaluationSubstitutionType.TEMPLATE,
        },
      },
    };
    evaluator.updateDataTree(updatedUnEvalTree);
    const dataTree = evaluator.evalTree;
    expect(dataTree).toHaveProperty("Dropdown2.options.0.label", "newValue");
  });

  it("Adds an entity with a complicated binding", () => {
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
    evaluator.updateDataTree(updatedUnEvalTree);
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
    expect(updatedDependencyMap).toStrictEqual({
      Api1: ["Api1.data"],
      Text1: ["Text1.text"],
      Text2: ["Text2.text"],
      Text3: ["Text3.text"],
      Text4: ["Text4.text"],
      Table1: [
        "Table1.tableData",
        "Table1.searchText",
        "Table1.selectedRowIndex",
        "Table1.selectedRowIndices",
      ],
      Dropdown1: [
        "Dropdown1.selectedOptionValue",
        "Dropdown1.selectedOptionValueArr",
      ],
      "Text2.text": ["Text1.text"],
      "Text3.text": ["Text1.text"],
      "Dropdown1.selectedOptionValue": [],
      "Dropdown1.selectedOptionValueArr": [],
      "Table1.tableData": ["Api1.data", "Text1.text"],
      "Table1.searchText": [],
      "Table1.selectedRowIndex": [],
      "Table1.selectedRowIndices": [],
      "Text4.text": [],
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
    evaluator.updateDataTree(updatedUnEvalTree);
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
    expect(updatedDependencyMap).toStrictEqual({
      Api1: ["Api1.data"],
      Text1: ["Text1.text"],
      Text2: ["Text2.text"],
      Text3: ["Text3.text"],
      Text4: ["Text4.text"],
      Table1: [
        "Table1.tableData",
        "Table1.selectedRowIndex",
        "Table1.searchText",
        "Table1.selectedRowIndices",
        "Table1.selectedRow",
      ],
      "Table1.selectedRow": ["Table1.selectedRow.test"],
      Dropdown1: [
        "Dropdown1.selectedOptionValue",
        "Dropdown1.selectedOptionValueArr",
      ],
      "Text2.text": ["Text1.text"],
      "Text3.text": ["Text1.text"],
      "Dropdown1.selectedOptionValue": [],
      "Dropdown1.selectedOptionValueArr": [],
      "Table1.tableData": ["Api1.data", "Text1.text"],
      "Table1.searchText": [],
      "Table1.selectedRowIndex": [],
      "Table1.selectedRowIndices": [],
      "Text4.text": ["Table1.selectedRow.test"],
    });
  });

  it("Honors predefined action dependencyMap", () => {
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
        bindingPaths: {
          ...BASE_ACTION.bindingPaths,
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
    evaluator.updateDataTree(updatedTree1);
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
    evaluator.updateDataTree(updatedTree2);
    const dataTree = evaluator.evalTree;
    expect(evaluator.dependencyMap["Api2.config.body"]).toStrictEqual([
      "Text1.text",
      "Api2.config.pluginSpecifiedTemplates[0].value",
    ]);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(dataTree.Api2.config.body).toBe("{ 'name': Test }");
    const updatedTree3 = {
      ...updatedTree2,
      Api2: {
        ...updatedTree2.Api2,
        bindingPaths: {
          ...updatedTree2.Api2.bindingPaths,
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
    evaluator.updateDataTree(updatedTree3);
    const dataTree3 = evaluator.evalTree;
    expect(evaluator.dependencyMap["Api2.config.body"]).toStrictEqual([
      "Text1.text",
      "Api2.config.pluginSpecifiedTemplates[0].value",
    ]);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(dataTree3.Api2.config.body).toBe("{ 'name': \"Test\" }");
  });
});
