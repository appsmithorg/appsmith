import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  generateDataTreeWidget,
  getSetterConfig,
} from "entities/DataTree/dataTreeWidget";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import WidgetFactory from "utils/WidgetFactory";

import { ValidationTypes } from "constants/WidgetValidation";
import { RenderModes } from "constants/WidgetConstants";

// const WidgetTypes = WidgetFactory.widgetTypes;

describe("generateDataTreeWidget", () => {
  beforeEach(() => {
    const getMetaProps = jest.spyOn(
      WidgetFactory,
      "getWidgetMetaPropertiesMap",
    );
    getMetaProps.mockReturnValueOnce({
      text: undefined,
      isDirty: false,
      isFocused: false,
    });

    const getDerivedProps = jest.spyOn(
      WidgetFactory,
      "getWidgetDerivedPropertiesMap",
    );
    getDerivedProps.mockReturnValueOnce({
      isValid: "{{true}}",
      value: "{{this.text}}",
    });

    const getDefaultProps = jest.spyOn(
      WidgetFactory,
      "getWidgetDefaultPropertiesMap",
    );
    getDefaultProps.mockReturnValueOnce({
      text: "defaultText",
    });

    const getPropertyConfig = jest.spyOn(
      WidgetFactory,
      "getWidgetPropertyPaneConfig",
    );
    getPropertyConfig.mockReturnValueOnce([
      {
        sectionName: "General",
        children: [
          {
            propertyName: "inputType",
            label: "Data type",
            controlType: "DROP_DOWN",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "defaultText",
            label: "Default Text",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "placeholderText",
            label: "Placeholder",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "regex",
            label: "Regex",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.REGEX },
          },
          {
            propertyName: "errorMessage",
            label: "Error message",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "isRequired",
            label: "Required",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "resetOnSubmit",
            label: "Reset on submit",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            propertyName: "onTextChanged",
            label: "onTextChanged",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            propertyName: "onSubmit",
            label: "onSubmit",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("generates enhanced widget with the right properties", () => {
    const widget: FlattenedWidgetProps = {
      bottomRow: 0,
      isLoading: false,
      leftColumn: 0,
      parentColumnSpace: 0,
      parentRowSpace: 0,
      renderMode: RenderModes.CANVAS,
      rightColumn: 0,
      topRow: 0,
      type: "INPUT_WIDGET_V2",
      version: 0,
      widgetId: "123",
      widgetName: "Input1",
      defaultText: "",
      deepObj: {
        level1: {
          value: 10,
        },
      },
    };

    const widgetMetaProps: Record<string, unknown> = {
      text: "Tester",
      isDirty: true,
      deepObj: {
        level1: {
          metaValue: 10,
        },
      },
    };

    const getMetaProps = jest.spyOn(
      WidgetFactory,
      "getWidgetMetaPropertiesMap",
    );

    getMetaProps.mockReturnValueOnce({
      text: true,
      isDirty: true,
    });

    const bindingPaths = {
      defaultText: EvaluationSubstitutionType.TEMPLATE,
      placeholderText: EvaluationSubstitutionType.TEMPLATE,
      regex: EvaluationSubstitutionType.TEMPLATE,
      resetOnSubmit: EvaluationSubstitutionType.TEMPLATE,
      isVisible: EvaluationSubstitutionType.TEMPLATE,
      isRequired: EvaluationSubstitutionType.TEMPLATE,
      isDisabled: EvaluationSubstitutionType.TEMPLATE,
      errorMessage: EvaluationSubstitutionType.TEMPLATE,
    };

    const expectedData = {
      value: "{{Input1.text}}",
      isDirty: true,
      isFocused: false,
      isValid: "{{true}}",
      text: "Tester",
      bottomRow: 0,
      isLoading: false,
      leftColumn: 0,
      parentColumnSpace: 0,
      parentRowSpace: 0,
      rightColumn: 0,
      renderMode: RenderModes.CANVAS,
      version: 0,
      topRow: 0,
      widgetId: "123",
      widgetName: "Input1",
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      defaultText: "",
      type: "INPUT_WIDGET_V2",
      deepObj: {
        level1: {
          metaValue: 10,
        },
      },
      meta: {
        text: "Tester",
        isDirty: true,
        deepObj: {
          level1: {
            metaValue: 10,
          },
        },
      },
    };

    const expectedConfig = {
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      widgetId: "123",
      bindingPaths,
      reactivePaths: {
        ...bindingPaths,
        isDirty: EvaluationSubstitutionType.TEMPLATE,
        isFocused: EvaluationSubstitutionType.TEMPLATE,
        isValid: EvaluationSubstitutionType.TEMPLATE,
        text: EvaluationSubstitutionType.TEMPLATE,
        value: EvaluationSubstitutionType.TEMPLATE,
        "meta.text": EvaluationSubstitutionType.TEMPLATE,
      },

      triggerPaths: {
        onSubmit: true,
        onTextChanged: true,
      },
      type: "INPUT_WIDGET_V2",
      validationPaths: {
        defaultText: { type: ValidationTypes.TEXT },
        errorMessage: { type: ValidationTypes.TEXT },
        isDisabled: { type: ValidationTypes.BOOLEAN },
        isRequired: { type: ValidationTypes.BOOLEAN },
        isVisible: { type: ValidationTypes.BOOLEAN },
        placeholderText: { type: ValidationTypes.TEXT },
        regex: { type: ValidationTypes.REGEX },
        resetOnSubmit: { type: ValidationTypes.BOOLEAN },
      },
      dynamicBindingPathList: [
        {
          key: "isValid",
        },
        {
          key: "value",
        },
      ],
      logBlackList: {
        isValid: true,
        value: true,
      },
      propertyOverrideDependency: {
        text: {
          DEFAULT: "defaultText",
          META: "meta.text",
        },
      },
      defaultMetaProps: ["text", "isDirty", "isFocused"],
      defaultProps: {
        text: "defaultText",
      },
      overridingPropertyPaths: {
        defaultText: ["text", "meta.text"],
        "meta.text": ["text"],
      },
      privateWidgets: {},
      isMetaPropDirty: true,
    };

    const result = generateDataTreeWidget(widget, widgetMetaProps);
    expect(result.unEvalEntity).toStrictEqual(expectedData);
    expect(result.configEntity).toStrictEqual(expectedConfig);
  });

  it("generates setterConfig with the dynamic data", () => {
    // Input widget
    const inputWidget: FlattenedWidgetProps = {
      bottomRow: 0,
      isLoading: false,
      leftColumn: 0,
      parentColumnSpace: 0,
      parentRowSpace: 0,
      renderMode: RenderModes.CANVAS,
      rightColumn: 0,
      topRow: 0,
      type: "INPUT_WIDGET_V2",
      version: 0,
      widgetId: "123",
      widgetName: "Input1",
      defaultText: "",
      deepObj: {
        level1: {
          value: 10,
        },
      },
    };

    const inputSetterConfig: Record<string, any> = {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setDisabled: {
          path: "isDisabled",
          type: "boolean",
        },
        setRequired: {
          path: "isRequired",
          type: "boolean",
        },
        setValue: {
          path: "defaultText",
          type: "string",
        },
      },
    };

    const expectedInputData = {
      __setters: {
        setVisibility: {
          path: "Input1.isVisible",
          type: "boolean",
        },
        setDisabled: {
          path: "Input1.isDisabled",
          type: "boolean",
        },
        setRequired: {
          path: "Input1.isRequired",
          type: "boolean",
        },
        setValue: {
          path: "Input1.defaultText",
          type: "string",
        },
      },
    };

    const inputResult = getSetterConfig(inputSetterConfig, inputWidget);

    expect(inputResult).toStrictEqual(expectedInputData);

    //Json form widget

    const jsonFormWidget: FlattenedWidgetProps = {
      bottomRow: 0,
      isLoading: false,
      leftColumn: 0,
      parentColumnSpace: 0,
      parentRowSpace: 0,
      renderMode: RenderModes.CANVAS,
      rightColumn: 0,
      topRow: 0,
      type: "FORM_WIDGET",
      version: 0,
      widgetId: "123",
      widgetName: "Form1",
      defaultText: "",
      deepObj: {
        level1: {
          value: 10,
        },
      },
    };

    const jsonFormSetterConfig: Record<string, any> = {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setData: {
          path: "sourceData",
          type: "object",
        },
      },
    };

    const expectedJsonFormData = {
      __setters: {
        setVisibility: {
          path: "Form1.isVisible",
          type: "boolean",
        },
        setData: {
          path: "Form1.sourceData",
          type: "object",
        },
      },
    };

    const jsonFormResult = getSetterConfig(
      jsonFormSetterConfig,
      jsonFormWidget,
    );

    expect(jsonFormResult).toStrictEqual(expectedJsonFormData);

    // Table widget
    const tableWidget: FlattenedWidgetProps = {
      bottomRow: 0,
      isLoading: false,
      leftColumn: 0,
      parentColumnSpace: 0,
      parentRowSpace: 0,
      renderMode: RenderModes.CANVAS,
      rightColumn: 0,
      topRow: 0,
      type: "TABLE_WIDGET",
      version: 0,
      widgetId: "123",
      widgetName: "Table1",
      defaultText: "",
      deepObj: {
        level1: {
          value: 10,
        },
      },
    };

    const tableSetterConfig: Record<string, any> = {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "string",
        },
        setSelectedRowIndex: {
          path: "defaultSelectedRowIndex",
          type: "number",
        },
        setData: {
          path: "tableData",
          type: "object",
        },
      },
    };

    const expectedTableData = {
      __setters: {
        setVisibility: {
          path: "Table1.isVisible",
          type: "string",
        },
        setSelectedRowIndex: {
          path: "Table1.defaultSelectedRowIndex",
          type: "number",
        },
        setData: {
          path: "Table1.tableData",
          type: "object",
        },
      },
    };

    const tableResult = getSetterConfig(tableSetterConfig, tableWidget);

    expect(tableResult).toStrictEqual(expectedTableData);
  });
});
