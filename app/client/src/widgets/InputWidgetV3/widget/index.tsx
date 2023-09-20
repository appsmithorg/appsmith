import React from "react";
import { merge, toString } from "lodash";

import {
  propertyPaneContentConfig,
  propertyPaneStyleConfig,
} from "./propertyPaneConfig";
import IconSVG from "../icon.svg";
import type {
  AutocompletionDefinitions,
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/constants";
import InputComponent from "../component";
import { INPUT_TYPES } from "../constants";
import { mergeWidgetConfig } from "utils/helpers";
import { parseText, validateInput } from "./helper";
import { DynamicHeight } from "utils/WidgetFeatures";
import type { WidgetState } from "widgets/BaseWidget";
import type { SetterConfig } from "entities/AppTheming";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import derivedProperties from "./parsedDerivedProperties";
import { BaseInputWidget } from "widgets/BaseInputWidgetV2";
import type { InputWidgetProps, KeyDownEvent } from "./types";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { BaseInputWidgetProps } from "widgets/BaseInputWidgetV2";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ResponsiveBehavior } from "layoutSystems/autolayout/utils/constants";

class InputWidget extends BaseInputWidget<InputWidgetProps, WidgetState> {
  static getConfig() {
    return {
      name: "Input",
      iconSVG: IconSVG,
      tags: [WIDGET_TAGS.SUGGESTED_WIDGETS, WIDGET_TAGS.INPUTS],
      needsMeta: true,
      searchTags: ["form", "text input", "number", "textarea"],
    };
  }

  static getFeatures() {
    return {
      dynamicHeight: {
        sectionIndex: 3,
        defaultValue: DynamicHeight.FIXED,
        active: true,
      },
    };
  }

  static getDefaults() {
    return {
      ...BaseInputWidget.getDefaults(),
      rows: 7,
      labelPosition: "top",
      inputType: "TEXT",
      widgetName: "Input",
      version: 2,
      showStepArrows: false,
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
    };
  }

  static getMethods() {
    return {
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        return [
          {
            propertyPath: "defaultText",
            propertyValue: propValueMap.data,
            isDynamicPropertyPath: true,
          },
        ];
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      disabledPropsDefaults: {
        labelPosition: "top",
        labelTextSize: "0.875rem",
      },
      autoDimension: (props: BaseInputWidgetProps) => ({
        height: props.inputType !== "MULTI_LINE_TEXT",
      }),
      defaults: {
        rows: 6.6,
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "120px",
            };
          },
        },
      ],
      disableResizeHandles: (props: BaseInputWidgetProps) => ({
        vertical: props.inputType !== "MULTI_LINE_TEXT",
      }),
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    const definitions: AutocompletionDefinitions = {
      "!doc":
        "An input text field is used to capture a users textual input such as their names, numbers, emails etc. Inputs are used in forms and can have custom validations.",
      "!url": "https://docs.appsmith.com/widget-reference/input",
      text: {
        "!type": "string",
        "!doc": "The text value of the input",
        "!url": "https://docs.appsmith.com/widget-reference/input",
      },
      isValid: "bool",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      isDisabled: "bool",
    };

    return definitions;
  }

  static getPropertyPaneContentConfig() {
    return mergeWidgetConfig(
      propertyPaneContentConfig,
      super.getPropertyPaneContentConfig(),
    );
  }

  static getPropertyPaneStyleConfig() {
    return mergeWidgetConfig(
      propertyPaneStyleConfig,
      super.getPropertyPaneStyleConfig(),
    );
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return merge(super.getDerivedPropertiesMap(), {
      isValid: `{{(() => {${derivedProperties.isValid}})()}}`,
    });
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return merge(super.getMetaPropertiesMap(), {
      inputText: "",
      text: "",
    });
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      inputText: "defaultText",
      text: "defaultText",
    };
  }

  static getSetterConfig(): SetterConfig {
    return {
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
          accessor: "text",
        },
      },
    };
  }

  static getStylesheetConfig() {
    return {};
  }

  onFocusChange = (focusState: boolean) => {
    if (focusState) {
      this.props.updateWidgetMetaProperty("isFocused", focusState, {
        triggerPropertyName: "onFocus",
        dynamicString: this.props.onFocus,
        event: {
          type: EventType.ON_FOCUS,
        },
      });
    }

    if (!focusState) {
      this.props.updateWidgetMetaProperty("isFocused", focusState, {
        triggerPropertyName: "onBlur",
        dynamicString: this.props.onBlur,
        event: {
          type: EventType.ON_BLUR,
        },
      });
    }

    super.onFocusChange(focusState);
  };

  onKeyDown = (e: KeyDownEvent) => {
    super.onKeyDown(e, this.props.inputType === INPUT_TYPES.MULTI_LINE_TEXT);
  };

  componentDidUpdate = (prevProps: InputWidgetProps) => {
    if (
      prevProps.inputText !== this.props.inputText &&
      this.props.inputText !== toString(this.props.text)
    ) {
      this.props.updateWidgetMetaProperty(
        "text",
        parseText(this.props.inputText, this.props.inputType),
      );
    }

    if (prevProps.inputType !== this.props.inputType) {
      this.props.updateWidgetMetaProperty(
        "text",
        parseText(this.props.inputText, this.props.inputType),
      );
    }
    // If defaultText property has changed, reset isDirty to false
    if (
      this.props.defaultText !== prevProps.defaultText &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  };

  onValueChange = (value: string) => {
    // Ideally text property should be derived property. But widgets with
    // derived properties won't work as expected inside a List widget.
    // TODO(Balaji): Once we refactor the List widget, need to conver
    // text to a derived property.
    this.props.updateWidgetMetaProperty(
      "text",
      parseText(value, this.props.inputType),
    );

    this.props.updateWidgetMetaProperty("inputText", value, {
      triggerPropertyName: "onTextChanged",
      dynamicString: this.props.onTextChanged,
      event: {
        type: EventType.ON_TEXT_CHANGE,
      },
    });

    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }
  };

  resetWidgetText = () => {
    this.props.updateWidgetMetaProperty("inputText", "");
    this.props.updateWidgetMetaProperty(
      "text",
      parseText("", this.props.inputType),
    );
  };

  getWidgetView() {
    const { inputText, inputType } = this.props;

    const value = inputText ?? "";
    const { errorMessage, validationStatus } = validateInput(this.props);

    return (
      <InputComponent
        autoComplete={this.props.shouldAllowAutofill}
        autoFocus={this.props.autoFocus}
        defaultValue={this.props.defaultText}
        errorMessage={errorMessage}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        inputType={inputType}
        isDisabled={this.props.isDisabled}
        isLoading={this.props.isLoading}
        label={this.props.label}
        labelAlign={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        maxChars={this.props.maxChars}
        maxNum={this.props.maxNum}
        minNum={this.props.minNum}
        onFocusChange={this.onFocusChange}
        onKeyDown={this.onKeyDown}
        onValueChange={this.onValueChange}
        placeholder={this.props.placeholderText}
        spellCheck={this.props.isSpellCheck}
        tooltip={this.props.tooltip}
        validationStatus={validationStatus}
        value={value}
        widgetId={this.props.widgetId}
      />
    );
  }

  static type = "INPUT_WIDGET_V3";
}

export { InputWidget };
