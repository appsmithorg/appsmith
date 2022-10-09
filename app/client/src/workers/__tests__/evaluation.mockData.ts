import { WidgetTypeConfigMap } from "utils/WidgetFactory";

export const WIDGET_CONFIG_MAP: WidgetTypeConfigMap = {
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

export const MOCK_EVAL_TREE = {
  Api1: {
    run: {},
    clear: {},
    actionId: "633bbe03612a7d38900354a1",
    name: "Api1",
    pluginId: "5ca385dc81b37f0004b4db85",
    pluginType: "API",
    config: {
      timeoutInMillisecond: 10000,
      paginationType: "NONE",
      path: "/users",
      headers: [
        {
          key: "",
          value: "",
        },
        {
          key: "",
          value: "",
        },
      ],
      encodeParamsToggle: true,
      queryParameters: [],
      bodyFormData: [],
      httpMethod: "GET",
      pluginSpecifiedTemplates: [
        {
          value: true,
        },
      ],
      formData: {
        apiContentType: "none",
      },
    },
    dynamicBindingPathList: [],
    responseMeta: {
      isExecutionSuccess: false,
    },
    ENTITY_TYPE: "ACTION",
    isLoading: false,
    dependencyMap: {
      "config.body": ["config.pluginSpecifiedTemplates[0].value"],
    },
    logBlackList: {},
    datasourceUrl: "https://mock-api.appsmith.com",
    __evaluation__: {
      errors: {
        "config.headers[0].key": [],
        "config.headers[0].value": [],
        "config.headers[1].key": [],
        "config.headers[1].value": [],
      },
      evaluatedValues: {
        "config.headers[0].key": "",
        "config.headers[0].value": "",
        "config.headers[1].key": "",
        "config.headers[1].value": "",
      },
    },
  },
  MainContainer: {
    widgetName: "MainContainer",
    backgroundColor: "none",
    rightColumn: 4896,
    snapColumns: 64,
    detachFromLayout: true,
    widgetId: "0",
    topRow: 0,
    bottomRow: 5000,
    containerStyle: "none",
    snapRows: 125,
    parentRowSpace: 1,
    type: "CANVAS_WIDGET",
    canExtend: true,
    version: 64,
    minHeight: 1292,
    dynamicTriggerPathList: [],
    parentColumnSpace: 1,
    dynamicBindingPathList: [],
    leftColumn: 0,
    children: [],
    defaultProps: {},
    defaultMetaProps: [],
    logBlackList: {},
    meta: {},
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    bindingPaths: {},
    reactivePaths: {},
    triggerPaths: {},
    validationPaths: {},
    ENTITY_TYPE: "WIDGET",
    privateWidgets: {},
  },
  pageList: [
    {
      pageName: "Page1",
      pageId: "633bbdf82b97d020da90e6a9",
      isDefault: true,
      isHidden: false,
      slug: "page1",
    },
  ],
  appsmith: {
    store: {},
    mode: "EDIT",
    ENTITY_TYPE: "APPSMITH",
  },
};
