import React from "react";
import { isNumber, merge, toString } from "lodash";

import {
  propertyPaneContentConfig,
  propertyPaneStyleConfig,
} from "./propertyPaneConfig";
import IconSVG from "../icon.svg";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/constants";
import InputComponent from "../component";
import { INPUT_TYPES } from "../constants";
import type { InputWidgetProps } from "./types";
import { mergeWidgetConfig } from "utils/helpers";
import { parseText, validateInput } from "./helper";
import { DynamicHeight } from "utils/WidgetFeatures";
import type { WidgetState } from "widgets/BaseWidget";
import type { SetterConfig } from "entities/AppTheming";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import derivedProperties from "./parsedDerivedProperties";
import { WDSBaseInputWidget } from "../../WDSBaseInputWidget";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { BaseInputWidgetProps } from "../../WDSBaseInputWidget";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { KeyDownEvent } from "widgets/wds/WDSBaseInputWidget/component/types";

class WDSInputWidget extends WDSBaseInputWidget<InputWidgetProps, WidgetState> {
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
      ...WDSBaseInputWidget.getDefaults(),
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

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "70px" },
        minWidth: { base: "120px" },
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    const definitions: AutocompletionDefinitions = {
      "!doc":
        "An input text field is used to capture a users textual input such as their names, numbers, emails etc. Inputs are used in forms and can have custom validations.",
      "!url": "https://docs.appsmith.com/widget-reference/input",
      parsedText: {
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
      rawText: "",
      parsedText: "",
    });
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      rawText: "defaultText",
      parsedText: "defaultText",
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
          accessor: "parsedText",
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
    if (this.props.inputType === INPUT_TYPES.NUMBER) {
      // don't allow entering anything other than numbers. but allow backspace, arrows delete, tab, enter
      if (
        !(
          (e.key >= "0" && e.key <= "9") ||
          (e.key >= "0" && e.key <= "9" && e.code.includes("Numpad")) ||
          e.key === "Backspace" ||
          e.key === "Tab" ||
          e.key === "Enter" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "Delete" ||
          e.ctrlKey ||
          e.metaKey ||
          e.altKey
        )
      ) {
        e.preventDefault();
      }

      // increment or decrement the value by 1 on arrow up/down
      // Note: we are doing this manually because we are using input="text" for inputType = NUMBER
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const currentValue = Number(this.props.rawText);
        const newValue =
          e.key === "ArrowDown" ? currentValue - 1 : currentValue + 1;

        if (isNumber(newValue) && !isNaN(newValue)) {
          this.onValueChange(newValue.toString());
        }
      }
    }

    super.onKeyDown(e, this.props.inputType === INPUT_TYPES.MULTI_LINE_TEXT);
  };

  componentDidUpdate = (prevProps: InputWidgetProps) => {
    if (
      prevProps.rawText !== this.props.rawText &&
      this.props.rawText !== toString(this.props.parsedText)
    ) {
      this.props.updateWidgetMetaProperty(
        "parsedText",
        parseText(this.props.rawText, this.props.inputType),
      );
    }

    if (prevProps.inputType !== this.props.inputType) {
      this.props.updateWidgetMetaProperty(
        "parsedText",
        parseText(this.props.rawText, this.props.inputType),
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
      "parsedText",
      parseText(value, this.props.inputType),
    );

    this.props.updateWidgetMetaProperty("rawText", value, {
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
    this.props.updateWidgetMetaProperty("rawText", "");
    this.props.updateWidgetMetaProperty(
      "parsedText",
      parseText("", this.props.inputType),
    );
  };

  getWidgetView() {
    const { inputType, rawText } = this.props;

    const value = rawText ?? "";
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
        isRequired={this.props.isRequired}
        label={this.props.label}
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

  static type = "WDS_INPUT_WIDGET";
}

export { WDSInputWidget };
