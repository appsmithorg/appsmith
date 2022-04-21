import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import { WidgetType, TextSize } from "constants/WidgetConstants";
import {
  EventType,
  ExecutionResult,
} from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import BaseInputComponent from "../component";
import { InputTypes } from "../constants";
import { LabelPosition } from "components/constants";

class BaseInputWidget<
  T extends BaseInputWidgetProps,
  K extends WidgetState
> extends BaseWidget<T, K> {
  constructor(props: T) {
    super(props);
  }

  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText:
              "Adds a validation to the input which displays an error on failure",
            propertyName: "regex",
            label: "Regex",
            controlType: "INPUT_TEXT",
            placeholderText: "^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.REGEX },
          },
          {
            helpText: "Sets the input validity based on a JS expression",
            propertyName: "validation",
            label: "Valid",
            controlType: "INPUT_TEXT",
            placeholderText: "{{ Input1.text.length > 0 }}",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
              params: {
                default: true,
              },
            },
          },
          {
            helpText:
              "The error message to display if the regex or valid property check fails",
            propertyName: "errorMessage",
            label: "Error Message",
            controlType: "INPUT_TEXT",
            placeholderText: "Not a valid value!",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets a placeholder text for the input",
            propertyName: "placeholderText",
            label: "Placeholder",
            controlType: "INPUT_TEXT",
            placeholderText: "Placeholder",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Show help text or details about current input",
            propertyName: "tooltip",
            label: "Tooltip",
            controlType: "INPUT_TEXT",
            placeholderText: "Value must be atleast 6 chars",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Disables input to this widget",
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Clears the input value after submit",
            propertyName: "resetOnSubmit",
            label: "Reset on submit",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Focus input automatically on load",
            propertyName: "autoFocus",
            label: "Auto Focus",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isSpellCheck",
            label: "Spellcheck",
            helpText:
              "Defines whether the text input may be checked for spelling errors",
            controlType: "SWITCH",
            isJSConvertible: false,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
            hidden: (props: BaseInputWidgetProps) => {
              return props.inputType !== InputTypes.TEXT;
            },
            dependencies: ["inputType"],
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the text is changed",
            propertyName: "onTextChanged",
            label: "onTextChanged",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText:
              "Triggers an action on submit (when the enter key is pressed)",
            propertyName: "onSubmit",
            label: "onSubmit",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
      {
        sectionName: "Label",
        children: [
          {
            helpText: "Sets the label text of the widget",
            propertyName: "label",
            label: "Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Name:",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label position of the widget",
            propertyName: "labelPosition",
            label: "Position",
            controlType: "DROP_DOWN",
            options: [
              { label: "Left", value: LabelPosition.Left },
              { label: "Top", value: LabelPosition.Top },
              { label: "Auto", value: LabelPosition.Auto },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label alignment of the widget",
            propertyName: "labelAlignment",
            label: "Alignment",
            controlType: "LABEL_ALIGNMENT_OPTIONS",
            options: [
              {
                icon: "LEFT_ALIGN",
                value: Alignment.LEFT,
              },
              {
                icon: "RIGHT_ALIGN",
                value: Alignment.RIGHT,
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
            hidden: (props: BaseInputWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
          {
            helpText:
              "Sets the label width of the widget as the number of columns",
            propertyName: "labelWidth",
            label: "Width (in columns)",
            controlType: "NUMERIC_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            min: 0,
            validation: {
              type: ValidationTypes.NUMBER,
              params: {
                natural: true,
              },
            },
            hidden: (props: BaseInputWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
        ],
      },
      {
        sectionName: "Label Styles",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Text Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
          {
            propertyName: "labelTextSize",
            label: "Text Size",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Heading 1",
                value: "HEADING1",
                subText: "24px",
                icon: "HEADING_ONE",
              },
              {
                label: "Heading 2",
                value: "HEADING2",
                subText: "18px",
                icon: "HEADING_TWO",
              },
              {
                label: "Heading 3",
                value: "HEADING3",
                subText: "16px",
                icon: "HEADING_THREE",
              },
              {
                label: "Paragraph",
                value: "PARAGRAPH",
                subText: "14px",
                icon: "PARAGRAPH",
              },
              {
                label: "Paragraph 2",
                value: "PARAGRAPH2",
                subText: "12px",
                icon: "PARAGRAPH_TWO",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "labelStyle",
            label: "Label Font Style",
            controlType: "BUTTON_TABS",
            options: [
              {
                icon: "BOLD_FONT",
                value: "BOLD",
              },
              {
                icon: "ITALICS_FONT",
                value: "ITALIC",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{this.text}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      text: "defaultText",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      text: undefined,
      isFocused: false,
      isDirty: false,
    };
  }

  handleFocusChange(focusState: boolean) {
    /**
     * Reason for disabling drag on focusState: true:
     * 1. In Firefox, draggable="true" property on the parent element
     *    or <input /> itself, interferes with some <input /> element's events
     *    Bug Ref - https://bugzilla.mozilla.org/show_bug.cgi?id=800050
     *              https://bugzilla.mozilla.org/show_bug.cgi?id=1189486
     *
     *  Eg - input with draggable="true", double clicking the text; won't highlight the text
     *
     * 2. Dragging across the text (for text selection) in input won't cause the widget to drag.
     */
    this.props.updateWidgetMetaProperty("dragDisabled", focusState);
    this.props.updateWidgetMetaProperty("isFocused", focusState);
  }

  resetWidgetText() {
    this.props.updateWidgetMetaProperty("text", "");
  }

  onSubmitSuccess = (result: ExecutionResult) => {
    if (result.success && this.props.resetOnSubmit) {
      //Resets isDirty
      super.resetChildrenMetaProperty(this.props.widgetId);
      this.resetWidgetText();
    }
  };

  handleKeyDown(
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) {
    const { isValid, onSubmit } = this.props;
    const isEnterKey = e.key === "Enter" || e.keyCode === 13;
    if (isEnterKey && typeof onSubmit === "string" && onSubmit && isValid) {
      /**
       * Originally super.executeAction was used to trigger the ON_SUBMIT action and
       * updateMetaProperty to update the text.
       * Since executeAction is not queued and updateMetaProperty is,
       * the user would observe that the data tree only gets partially updated with text
       * before the ON_SUBMIT would get triggered,
       * if they type {enter} really fast after typing some input text.
       * So we're using updateMetaProperty to trigger the ON_SUBMIT to let the data tree update
       * before we actually execute the action.
       * Since updateMetaProperty expects a meta property to be updated,
       * we are redundantly updating the common meta property, isDirty which is common on its child widgets here. But the main part is the action execution payload.
       */
      this.props.updateWidgetMetaProperty("isDirty", this.props.isDirty, {
        triggerPropertyName: "onSubmit",
        dynamicString: onSubmit,
        event: {
          type: EventType.ON_SUBMIT,
          callback: this.onSubmitSuccess,
        },
      });
    }
  }

  getPageView() {
    return (
      <BaseInputComponent
        allowNumericCharactersOnly={this.props.allowNumericCharactersOnly}
        autoFocus={this.props.autoFocus}
        compactMode={this.props.compactMode}
        defaultValue={this.props.defaultValue}
        disableNewLineOnPressEnterKey={this.props.disableNewLineOnPressEnterKey}
        disabled={this.props.isDisabled}
        errorMessage={this.props.errorMessage}
        fill={this.props.fill}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        inputHTMLType="TEXT"
        inputType={this.props.inputType}
        intent={this.props.intent}
        isInvalid={this.props.isInvalid}
        isLoading={this.props.isLoading}
        label={this.props.label}
        labelAlignment={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelWidth={this.getLabelWidth()}
        maxChars={this.props.maxChars}
        multiline={this.props.multiline}
        onFocusChange={this.props.onFocusChange}
        onKeyDown={this.handleKeyDown}
        onValueChange={this.props.onValueChange}
        placeholder={this.props.placeholder}
        showError={this.props.showError}
        stepSize={1}
        tooltip={this.props.tooltip}
        value={this.props.value}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "BASE_INPUT_WIDGET";
  }
}

export interface BaseInputValidator {
  validationRegex: string;
  errorMessage: string;
}
export interface BaseInputWidgetProps extends WidgetProps {
  inputType: InputTypes;
  tooltip?: string;
  isDisabled?: boolean;
  validation: boolean;
  text: string;
  regex?: string;
  errorMessage?: string;
  placeholderText?: string;
  label: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  inputValidators: BaseInputValidator[];
  isValid: boolean;
  focusIndex?: number;
  isAutoFocusEnabled?: boolean;
  isRequired?: boolean;
  isFocused?: boolean;
  isDirty?: boolean;
  autoFocus?: boolean;
  iconName?: IconName;
  iconAlign?: Omit<Alignment, "center">;
  onSubmit?: string;
}

export default BaseInputWidget;
