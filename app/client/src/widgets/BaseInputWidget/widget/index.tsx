import { Alignment } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";
import { LabelPosition } from "components/constants";
import type { ExecutionResult } from "constants/AppsmithActionConstants/ActionConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import React from "react";
import { isAutoLayout } from "layoutSystems/autolayout/utils/flexWidgetUtils";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import type { InputWidgetProps } from "widgets/InputWidgetV2/widget";
import { isInputTypeEmailOrPassword } from "widgets/InputWidgetV2/widget/Utilities";
import BaseInputComponent from "../component";
import { InputTypes } from "../constants";
import { checkInputTypeTextByProps } from "../utils";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

import IconSVG from "../icon.svg";
import type {
  WidgetBaseConfiguration,
  WidgetDefaultProps,
} from "WidgetProvider/constants";
import type { PropertyPaneConfig } from "constants/PropertyControlConstants";

class BaseInputWidget<
  T extends BaseInputWidgetProps,
  K extends WidgetState,
> extends BaseWidget<T, K> {
  constructor(props: T) {
    super(props);
  }

  static type = "BASE_INPUT_WIDGET";

  static getConfig(): WidgetBaseConfiguration {
    return {
      name: "Input",
      hideCard: true,
      iconSVG: IconSVG,
      needsMeta: true,
    };
  }

  static getDefaults(): WidgetDefaultProps {
    return {
      rows: 4,
      label: "Label",
      labelPosition: LabelPosition.Left,
      labelAlignment: Alignment.LEFT,
      labelTextSize: "0.875rem",
      labelWidth: 5,
      columns: 20,
      widgetName: "Input",
      version: 1,
      defaultText: "",
      iconAlign: "left",
      autoFocus: false,
      labelStyle: "",
      resetOnSubmit: true,
      isRequired: false,
      isDisabled: false,
      animateLoading: true,
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
    };
  }

  static getPropertyPaneContentConfig(
    generalProperties: PropertyPaneConfig[] = [],
  ) {
    return [
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
            controlType: "ICON_TABS",
            fullWidth: true,
            hidden: isAutoLayout,
            options: [
              { label: "Auto", value: LabelPosition.Auto },
              { label: "Left", value: LabelPosition.Left },
              { label: "Top", value: LabelPosition.Top },
            ],
            defaultValue: LabelPosition.Top,
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label alignment of the widget",
            propertyName: "labelAlignment",
            label: "Alignment",
            controlType: "LABEL_ALIGNMENT_OPTIONS",
            fullWidth: false,
            options: [
              {
                startIcon: "align-left",
                value: Alignment.LEFT,
              },
              {
                startIcon: "align-right",
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
        sectionName: "Validation",
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
            label: "Error message",
            controlType: "INPUT_TEXT",
            placeholderText: "Not a valid value!",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
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
              return !checkInputTypeTextByProps(props);
            },
            dependencies: ["inputType"],
          },
        ],
      },
      {
        sectionName: "General",
        children: [
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
            helpText: "Show arrows to increase or decrease values",
            propertyName: "showStepArrows",
            label: "Show step arrows",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
              params: {
                default: false,
              },
            },
            hidden: (props: BaseInputWidgetProps) => {
              return (
                props.type !== "CURRENCY_INPUT_WIDGET" &&
                props.inputType !== InputTypes.NUMBER
              );
            },
            dependencies: ["inputType"],
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
            propertyName: "animateLoading",
            label: "Animate loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Focus input automatically on load",
            propertyName: "autoFocus",
            label: "Auto focus",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "shouldAllowAutofill",
            label: "Allow autofill",
            helpText: "Allow users to autofill values from browser",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
            hidden: (props: InputWidgetProps) => {
              //should be shown for only inputWidgetV2 and for email or password input types
              return !(
                isInputTypeEmailOrPassword(props?.inputType) &&
                props.type === "INPUT_WIDGET_V2"
              );
            },
            dependencies: ["inputType"],
          },
          {
            propertyName: "allowFormatting",
            label: "Enable formatting",
            helpText: "Formats the phone number as per the country selected",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
            hidden: (props: BaseInputWidgetProps) => {
              return props.type !== "PHONE_INPUT_WIDGET";
            },
          },
          ...generalProperties,
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "when the text is changed",
            propertyName: "onTextChanged",
            label: "onTextChanged",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "when the input field receives focus",
            propertyName: "onFocus",
            label: "onFocus",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "when the input field loses focus",
            propertyName: "onBlur",
            label: "onBlur",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "on submit (when the enter key is pressed)",
            propertyName: "onSubmit",
            label: "onSubmit",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
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
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Label styles",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Font color",
            helpText: "Control the color of the label associated",
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
            label: "Font size",
            helpText: "Control the font size of the label associated",
            controlType: "DROP_DOWN",
            defaultValue: "0.875rem",
            hidden: isAutoLayout,
            options: [
              {
                label: "S",
                value: "0.875rem",
                subText: "0.875rem",
              },
              {
                label: "M",
                value: "1rem",
                subText: "1rem",
              },
              {
                label: "L",
                value: "1.25rem",
                subText: "1.25rem",
              },
              {
                label: "XL",
                value: "1.875rem",
                subText: "1.875rem",
              },
              {
                label: "XXL",
                value: "3rem",
                subText: "3rem",
              },
              {
                label: "3XL",
                value: "3.75rem",
                subText: "3.75rem",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelStyle",
            label: "Emphasis",
            helpText: "Control if the label should be bold or italics",
            controlType: "BUTTON_GROUP",
            options: [
              {
                icon: "text-bold",
                value: "BOLD",
              },
              {
                icon: "text-italic",
                value: "ITALIC",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and shadow",
        children: [
          {
            propertyName: "accentColor",
            label: "Accent color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
            invisible: true,
          },
          {
            propertyName: "borderRadius",
            label: "Border radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "boxShadow",
            label: "Box shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      text: undefined,
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

    if (this.props.inputType === InputTypes.MULTI_LINE_TEXT) {
      if (
        isEnterKey &&
        (e.metaKey || e.ctrlKey) &&
        typeof onSubmit === "string" &&
        onSubmit
      ) {
        this.props.updateWidgetMetaProperty("isDirty", this.props.isDirty, {
          triggerPropertyName: "onSubmit",
          dynamicString: onSubmit,
          event: {
            type: EventType.ON_SUBMIT,
            callback: this.onSubmitSuccess,
          },
        });
      }
    } else {
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
  }

  getWidgetView() {
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
        labelWidth={this.props.labelComponentWidth}
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
  labelTextSize?: string;
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
  labelComponentWidth?: number;
}

export default BaseInputWidget;
