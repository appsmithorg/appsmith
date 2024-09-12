import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  generateDataTreeWidget,
  getSetterConfig,
} from "entities/DataTree/dataTreeWidget";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import WidgetFactory from "WidgetProvider/factory";

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
      componentWidth: 0,
      componentHeight: 0,
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
        isValid: EvaluationSubstitutionType.TEMPLATE,
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
      dependencyMap: {},
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

    const result = generateDataTreeWidget(widget, widgetMetaProps, new Set());
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      primaryColumns: {
        step: {
          index: 0,
          width: 150,
          id: "step",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDerived: false,
          label: "step",
          computedValue:
            "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.step))}}",
        },
        task: {
          index: 1,
          width: 150,
          id: "task",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDerived: false,
          label: "task",
          computedValue:
            "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.task))}}",
        },
        status: {
          index: 2,
          width: 150,
          id: "status",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "text",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDerived: false,
          label: "status",
          computedValue:
            "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.status))}}",
        },
        action: {
          index: 3,
          width: 150,
          id: "action",
          horizontalAlignment: "LEFT",
          verticalAlignment: "CENTER",
          columnType: "button",
          textSize: "PARAGRAPH",
          enableFilter: true,
          enableSort: true,
          isVisible: true,
          isCellVisible: true,
          isDisabled: false,
          isDerived: false,
          label: "action",
          onClick:
            "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
          computedValue:
            "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.action))}}",
        },
      },
    };

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableSetterConfig: Record<string, any> = {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "string",
        },
        setSelectedRowIndex: {
          path: "defaultSelectedRowIndex",
          type: "number",
          disabled: "return options.entity.multiRowSelection",
        },
        setSelectedRowIndices: {
          path: "defaultSelectedRowIndices",
          type: "array",
          disabled: "return !options.entity.multiRowSelection",
        },
        setData: {
          path: "tableData",
          type: "array",
        },
      },
      text: {
        __setters: {
          setIsRequired: {
            path: "primaryColumns.$columnId.isRequired",
            type: "boolean",
          },
        },
      },
      button: {
        __setters: {
          setIsRequired: {
            path: "primaryColumns.$columnId.isRequired",
            type: "boolean",
          },
        },
      },
      pathToSetters: [
        { path: "primaryColumns.$columnId", property: "columnType" },
      ],
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
          disabled: "return options.entity.multiRowSelection",
        },
        setSelectedRowIndices: {
          path: "Table1.defaultSelectedRowIndices",
          type: "array",
          disabled: "return !options.entity.multiRowSelection",
        },
        setData: {
          path: "Table1.tableData",
          type: "array",
        },
        "primaryColumns.action.setIsRequired": {
          path: "Table1.primaryColumns.action.isRequired",
          type: "boolean",
        },
        "primaryColumns.status.setIsRequired": {
          path: "Table1.primaryColumns.status.isRequired",
          type: "boolean",
        },
        "primaryColumns.step.setIsRequired": {
          path: "Table1.primaryColumns.step.isRequired",
          type: "boolean",
        },
        "primaryColumns.task.setIsRequired": {
          path: "Table1.primaryColumns.task.isRequired",
          type: "boolean",
        },
      },
    };

    const tableResult = getSetterConfig(tableSetterConfig, tableWidget);

    expect(tableResult).toStrictEqual(expectedTableData);
  });
});
