import { DataTreeEvaluator } from "./evaluation.worker";
import {
  DataTreeAction,
  DataTreeWidget,
  ENTITY_TYPE,
} from "../entities/DataTree/dataTreeFactory";
import { WidgetTypeConfigMap } from "../utils/WidgetFactory";
import { RenderModes, WidgetTypes } from "../constants/WidgetConstants";
import { PluginType } from "../entities/Action";

const WIDGET_CONFIG_MAP: WidgetTypeConfigMap = {
  CONTAINER_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
    },
    defaultProperties: {},
    derivedProperties: {},
    triggerProperties: {},
    metaProperties: {},
  },
  TEXT_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      text: "TEXT",
      textStyle: "TEXT",
      shouldScroll: "BOOLEAN",
    },
    defaultProperties: {},
    derivedProperties: {
      value: "{{ this.text }}",
    },
    triggerProperties: {},
    metaProperties: {},
  },
  BUTTON_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      text: "TEXT",
      buttonStyle: "TEXT",
    },
    defaultProperties: {},
    derivedProperties: {},
    triggerProperties: {
      onClick: true,
    },
    metaProperties: {},
  },
  INPUT_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      inputType: "TEXT",
      defaultText: "TEXT",
      text: "TEXT",
      regex: "REGEX",
      errorMessage: "TEXT",
      placeholderText: "TEXT",
      maxChars: "NUMBER",
      minNum: "NUMBER",
      maxNum: "NUMBER",
      label: "TEXT",
      inputValidators: "ARRAY",
      focusIndex: "NUMBER",
      isAutoFocusEnabled: "BOOLEAN",
      isRequired: "BOOLEAN",
      isValid: "BOOLEAN",
    },
    defaultProperties: {
      text: "defaultText",
    },
    derivedProperties: {
      isValid:
        '{{\n        function(){\n          let parsedRegex = null;\n          if (this.regex) {\n            /*\n            * break up the regexp pattern into 4 parts: given regex, regex prefix , regex pattern, regex flags\n            * Example /test/i will be split into ["/test/gi", "/", "test", "gi"]\n            */\n            const regexParts = this.regex.match(/(\\/?)(.+)\\1([a-z]*)/i);\n            if (!regexParts) {\n              parsedRegex = new RegExp(this.regex);\n            } else {\n              /*\n              * if we don\'t have a regex flags (gmisuy), convert provided string into regexp directly\n              /*\n              if (regexParts[3] && !/^(?!.*?(.).*?\\1)[gmisuy]+$/.test(regexParts[3])) {\n                parsedRegex = RegExp(this.regex);\n              }\n              /*\n              * if we have a regex flags, use it to form regexp\n              */\n              parsedRegex = new RegExp(regexParts[2], regexParts[3]);\n            }\n          }\n          if (this.inputType === "EMAIL") {\n            const emailRegex = new RegExp(/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/);\n            return emailRegex.test(this.text);\n          }\n          else if (this.inputType === "NUMBER") {\n            return !isNaN(this.text)\n          }\n          else if (this.isRequired) {\n            if(this.text && this.text.length) {\n              if (parsedRegex) {\n                return parsedRegex.test(this.text)\n              } else {\n                return true;\n              }\n            } else {\n              return false;\n            }\n          } if (parsedRegex) {\n            return parsedRegex.test(this.text)\n          } else {\n            return true;\n          }\n        }()\n      }}',
      value: "{{this.text}}",
    },
    triggerProperties: {
      onTextChanged: true,
    },
    metaProperties: {
      isFocused: false,
      isDirty: false,
    },
  },
  CHECKBOX_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      label: "TEXT",
      defaultCheckedState: "BOOLEAN",
    },
    defaultProperties: {
      isChecked: "defaultCheckedState",
    },
    derivedProperties: {
      value: "{{this.isChecked}}",
    },
    triggerProperties: {
      onCheckChange: true,
    },
    metaProperties: {},
  },
  DROP_DOWN_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      placeholderText: "TEXT",
      label: "TEXT",
      options: "OPTIONS_DATA",
      selectionType: "TEXT",
      isRequired: "BOOLEAN",
      selectedOptionValues: "ARRAY",
      defaultOptionValue: "DEFAULT_OPTION_VALUE",
    },
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
    triggerProperties: {
      onOptionChange: true,
    },
    metaProperties: {},
  },
  RADIO_GROUP_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      label: "TEXT",
      options: "OPTIONS_DATA",
      selectedOptionValue: "TEXT",
      defaultOptionValue: "TEXT",
      isRequired: "BOOLEAN",
    },
    defaultProperties: {
      selectedOptionValue: "defaultOptionValue",
    },
    derivedProperties: {
      selectedOption:
        "{{_.find(this.options, { value: this.selectedOptionValue })}}",
      isValid: "{{ this.isRequired ? !!this.selectedOptionValue : true }}",
      value: "{{this.selectedOptionValue}}",
    },
    triggerProperties: {
      onSelectionChange: true,
    },
    metaProperties: {},
  },
  IMAGE_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      image: "TEXT",
      imageShape: "TEXT",
      defaultImage: "TEXT",
      maxZoomLevel: "NUMBER",
    },
    defaultProperties: {},
    derivedProperties: {},
    triggerProperties: {
      onClick: true,
    },
    metaProperties: {},
  },
  TABLE_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      tableData: "TABLE_DATA",
      nextPageKey: "TEXT",
      prevPageKey: "TEXT",
      label: "TEXT",
      searchText: "TEXT",
      defaultSearchText: "TEXT",
      defaultSelectedRow: "DEFAULT_SELECTED_ROW",
    },
    defaultProperties: {
      searchText: "defaultSearchText",
      selectedRowIndex: "defaultSelectedRow",
      selectedRowIndices: "defaultSelectedRow",
    },
    derivedProperties: {
      selectedRow: `{{ _.get(this.filteredTableData, this.selectedRowIndex, _.mapValues(this.filteredTableData[0], () => undefined)) }}`,
      selectedRows: `{{ this.filteredTableData.filter((item, i) => selectedRowIndices.includes(i) }); }}`,
    },
    triggerProperties: {
      onRowSelected: true,
      onPageChange: true,
      onSearchTextChanged: true,
      columnActions: true,
    },
    metaProperties: {
      pageNo: 1,
      selectedRow: {},
      selectedRows: [],
    },
  },
  VIDEO_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      url: "TEXT",
    },
    defaultProperties: {},
    derivedProperties: {},
    triggerProperties: {
      onEnd: true,
      onPlay: true,
      onPause: true,
    },
    metaProperties: {
      playState: "NOT_STARTED",
    },
  },
  FILE_PICKER_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      label: "TEXT",
      maxNumFiles: "NUMBER",
      allowedFileTypes: "ARRAY",
      files: "ARRAY",
      isRequired: "BOOLEAN",
    },
    defaultProperties: {},
    derivedProperties: {
      isValid: "{{ this.isRequired ? this.files.length > 0 : true }}",
      value: "{{this.files}}",
    },
    triggerProperties: {
      onFilesSelected: true,
    },
    metaProperties: {
      files: [],
      uploadedFileData: {},
    },
  },
  DATE_PICKER_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      defaultDate: "DATE",
      timezone: "TEXT",
      enableTimePicker: "BOOLEAN",
      dateFormat: "TEXT",
      label: "TEXT",
      datePickerType: "TEXT",
      maxDate: "DATE",
      minDate: "DATE",
      isRequired: "BOOLEAN",
    },
    defaultProperties: {
      selectedDate: "defaultDate",
    },
    derivedProperties: {
      isValid: "{{ this.isRequired ? !!this.selectedDate : true }}",
      value: "{{ this.selectedDate }}",
    },
    triggerProperties: {
      onDateSelected: true,
    },
    metaProperties: {},
  },
  TABS_WIDGET: {
    validations: {
      tabs: "TABS_DATA",
      defaultTab: "SELECTED_TAB",
    },
    defaultProperties: {},
    derivedProperties: {
      selectedTab:
        "{{_.find(this.tabs, { widgetId: this.selectedTabWidgetId }).label}}",
    },
    triggerProperties: {
      onTabSelected: true,
    },
    metaProperties: {},
  },
  MODAL_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
    },
    defaultProperties: {},
    derivedProperties: {},
    triggerProperties: {},
    metaProperties: {},
  },
  RICH_TEXT_EDITOR_WIDGET: {
    validations: {
      text: "TEXT",
      placeholder: "TEXT",
      defaultValue: "TEXT",
      isDisabled: "BOOLEAN",
      isVisible: "BOOLEAN",
    },
    defaultProperties: {
      text: "defaultText",
    },
    derivedProperties: {
      value: "{{this.text}}",
    },
    triggerProperties: {
      onTextChange: true,
    },
    metaProperties: {},
  },
  CHART_WIDGET: {
    validations: {
      xAxisName: "TEXT",
      yAxisName: "TEXT",
      chartName: "TEXT",
      isVisible: "BOOLEAN",
      chartData: "CHART_DATA",
    },
    defaultProperties: {},
    derivedProperties: {},
    triggerProperties: {},
    metaProperties: {},
  },
  FORM_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
    },
    defaultProperties: {},
    derivedProperties: {},
    triggerProperties: {},
    metaProperties: {},
  },
  FORM_BUTTON_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
      text: "TEXT",
      disabledWhenInvalid: "BOOLEAN",
      buttonStyle: "TEXT",
      buttonType: "TEXT",
    },
    defaultProperties: {},
    derivedProperties: {},
    triggerProperties: {
      onClick: true,
    },
    metaProperties: {},
  },
  MAP_WIDGET: {
    validations: {
      defaultMarkers: "MARKERS",
      isDisabled: "BOOLEAN",
      isVisible: "BOOLEAN",
      enableSearch: "BOOLEAN",
      enablePickLocation: "BOOLEAN",
      allowZoom: "BOOLEAN",
      zoomLevel: "NUMBER",
      mapCenter: "OBJECT",
    },
    defaultProperties: {
      markers: "defaultMarkers",
      center: "mapCenter",
    },
    derivedProperties: {},
    triggerProperties: {
      onMarkerClick: true,
      onCreateMarker: true,
    },
    metaProperties: {},
  },
  CANVAS_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
    },
    defaultProperties: {},
    derivedProperties: {},
    triggerProperties: {},
    metaProperties: {},
  },
  ICON_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
    },
    defaultProperties: {},
    derivedProperties: {},
    triggerProperties: {
      onClick: true,
    },
    metaProperties: {},
  },
  SKELETON_WIDGET: {
    validations: {
      isLoading: "BOOLEAN",
      isVisible: "BOOLEAN",
      isDisabled: "BOOLEAN",
    },
    defaultProperties: {},
    derivedProperties: {},
    triggerProperties: {},
    metaProperties: {},
  },
};

const BASE_WIDGET: DataTreeWidget = {
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
  type: WidgetTypes.SKELETON_WIDGET,
  parentId: "0",
  ENTITY_TYPE: ENTITY_TYPE.WIDGET,
};

const BASE_ACTION: DataTreeAction = {
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
  ENTITY_TYPE: ENTITY_TYPE.ACTION,
};

describe("DataTreeEvaluator", () => {
  const unEvalTree = {
    Text1: {
      ...BASE_WIDGET,
      widgetName: "Text1",
      text: "Label",
      type: WidgetTypes.TEXT_WIDGET,
    },
    Text2: {
      ...BASE_WIDGET,
      widgetName: "Text2",
      text: "{{Text1.text}}",
      dynamicBindingPathList: [{ key: "text" }],
      type: WidgetTypes.TEXT_WIDGET,
    },
    Text3: {
      ...BASE_WIDGET,
      widgetName: "Text3",
      text: "{{Text1.text}}",
      dynamicBindingPathList: [{ key: "text" }],
      type: WidgetTypes.TEXT_WIDGET,
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
      type: WidgetTypes.DROP_DOWN_WIDGET,
    },
    Table1: {
      ...BASE_WIDGET,
      tableData: "{{Api1.data.map(datum => ({ ...datum, raw: Text1.text }) )}}",
      dynamicBindingPathList: [{ key: "tableData" }],
      type: WidgetTypes.TABLE_WIDGET,
    },
    Text4: {
      ...BASE_WIDGET,
      text: "{{Table1.selectedRow.test}}",
      dynamicBindingPathList: [{ key: "text" }],
      type: WidgetTypes.TEXT_WIDGET,
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
    const updatedEvalTree = evaluator.updateDataTree(updatedUnEvalTree);
    expect(updatedEvalTree).toHaveProperty("Text2.text", "Hey there");
    expect(updatedEvalTree).toHaveProperty("Text3.text", "Hey there");
  });

  it("Evaluates a dependency change in update run", () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Text3: {
        ...unEvalTree.Text3,
        text: "Label 3",
      },
    };
    const updatedEvalTree = evaluator.updateDataTree(updatedUnEvalTree);
    const updatedDependencyMap = evaluator.dependencyMap;
    expect(updatedEvalTree).toHaveProperty("Text2.text", "Label");
    expect(updatedEvalTree).toHaveProperty("Text3.text", "Label 3");
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
        type: WidgetTypes.INPUT_WIDGET,
      },
    };

    const updatedEvalTree = evaluator.updateDataTree(updatedUnEvalTree);
    expect(updatedEvalTree).toHaveProperty("Input1.text", "Default value");
  });

  it("Evaluates for value changes in nested diff paths", () => {
    const updatedUnEvalTree = {
      ...unEvalTree,
      Dropdown1: {
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
        type: WidgetTypes.DROP_DOWN_WIDGET,
      },
    };
    const updatedEvalTree = evaluator.updateDataTree(updatedUnEvalTree);
    expect(updatedEvalTree).toHaveProperty(
      "Dropdown1.options.0.label",
      "newValue",
    );
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
    const updatedEvalTree = evaluator.updateDataTree(updatedUnEvalTree);
    const updatedDependencyMap = evaluator.dependencyMap;
    expect(updatedEvalTree).toHaveProperty("Table1.tableData", [
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
    const updatedEvalTree = evaluator.updateDataTree(updatedUnEvalTree);
    const updatedDependencyMap = evaluator.dependencyMap;
    expect(updatedEvalTree).toHaveProperty("Table1.tableData", [
      {
        test: "Hey",
        raw: "Label",
      },
      {
        test: "Ho",
        raw: "Label",
      },
    ]);
    expect(updatedEvalTree).toHaveProperty("Text4.text", "Hey");
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
});
