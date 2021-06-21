import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import {
  DataTreeWidget,
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import { RenderModes, WidgetTypes } from "constants/WidgetConstants";
import WidgetFactory from "utils/WidgetFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

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
            label: "Data Type",
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
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            propertyName: "placeholderText",
            label: "Placeholder",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            propertyName: "regex",
            label: "Regex",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.REGEX,
          },
          {
            propertyName: "errorMessage",
            label: "Error Message",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            propertyName: "isRequired",
            label: "Required",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "resetOnSubmit",
            label: "Reset on submit",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
        ],
      },
      {
        sectionName: "Actions",
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
      type: WidgetTypes.INPUT_WIDGET,
      version: 0,
      widgetId: "123",
      widgetName: "Input1",
      defaultText: "Testing",
    };

    const widgetMetaProps: Record<string, unknown> = {
      text: "Tester",
      isDirty: true,
    };

    const getMetaProps = jest.spyOn(
      WidgetFactory,
      "getWidgetMetaPropertiesMap",
    );

    getMetaProps.mockReturnValueOnce({
      text: true,
      isDirty: true,
    });

    const expected: DataTreeWidget = {
      bindingPaths: {
        defaultText: EvaluationSubstitutionType.TEMPLATE,
        errorMessage: EvaluationSubstitutionType.TEMPLATE,
        isDirty: EvaluationSubstitutionType.TEMPLATE,
        isDisabled: EvaluationSubstitutionType.TEMPLATE,
        isFocused: EvaluationSubstitutionType.TEMPLATE,
        isRequired: EvaluationSubstitutionType.TEMPLATE,
        isValid: EvaluationSubstitutionType.TEMPLATE,
        isVisible: EvaluationSubstitutionType.TEMPLATE,
        placeholderText: EvaluationSubstitutionType.TEMPLATE,
        regex: EvaluationSubstitutionType.TEMPLATE,
        resetOnSubmit: EvaluationSubstitutionType.TEMPLATE,
        text: EvaluationSubstitutionType.TEMPLATE,
        value: EvaluationSubstitutionType.TEMPLATE,
      },
      triggerPaths: {
        onSubmit: true,
        onTextChanged: true,
      },
      validationPaths: {
        defaultText: VALIDATION_TYPES.TEXT,
        errorMessage: VALIDATION_TYPES.TEXT,
        isDisabled: VALIDATION_TYPES.BOOLEAN,
        isRequired: VALIDATION_TYPES.BOOLEAN,
        isVisible: VALIDATION_TYPES.BOOLEAN,
        placeholderText: VALIDATION_TYPES.TEXT,
        regex: VALIDATION_TYPES.REGEX,
        resetOnSubmit: VALIDATION_TYPES.BOOLEAN,
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
      renderMode: RenderModes.CANVAS,
      rightColumn: 0,
      topRow: 0,
      type: WidgetTypes.INPUT_WIDGET,
      version: 0,
      widgetId: "123",
      widgetName: "Input1",
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      defaultText: "Testing",
      defaultMetaProps: ["text", "isDirty", "isFocused"],
      defaultProps: {
        text: "defaultText",
      },
    };

    const result = generateDataTreeWidget(widget, widgetMetaProps);

    expect(result).toStrictEqual(expected);
  });
});
