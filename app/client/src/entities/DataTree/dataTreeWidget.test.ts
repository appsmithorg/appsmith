import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
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
            label: "Error Message",
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

    const expected = {
      __config__: {
        ENTITY_TYPE: ENTITY_TYPE.WIDGET,
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
      rightColumn: 0,
      renderMode: RenderModes.CANVAS,
      version: 0,
      topRow: 0,
      widgetId: "123",
      widgetName: "Input1",
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      defaultText: "",
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

    const result = generateDataTreeWidget(widget, widgetMetaProps);
    expect(result).toStrictEqual(expected);
  });
});
