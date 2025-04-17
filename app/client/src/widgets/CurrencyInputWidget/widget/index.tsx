import React from "react";
import type { WidgetState } from "widgets/BaseWidget";
import type { CurrencyInputComponentProps } from "../component";
import CurrencyInputComponent from "../component";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { ValidationResponse } from "constants/WidgetValidation";
import { ValidationTypes } from "constants/WidgetValidation";
import { createMessage, FIELD_REQUIRED_ERROR } from "ee/constants/messages";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import {
  CurrencyDropdownOptions,
  getCountryCodeFromCurrencyCode,
} from "../component/CurrencyCodeDropdown";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import _ from "lodash";
import derivedProperties from "./parsedDerivedProperties";
import BaseInputWidget from "widgets/BaseInputWidget";
import type { BaseInputWidgetProps } from "widgets/BaseInputWidget/widget";
import log from "loglevel";
import {
  formatCurrencyNumber,
  limitDecimalValue,
} from "../component/utilities";
import { getLocale, mergeWidgetConfig } from "utils/helpers";
import {
  getLocaleDecimalSeperator,
  getLocaleThousandSeparator,
  isAutoHeightEnabledForWidget,
  DefaultAutocompleteDefinitions,
  isCompactMode,
} from "widgets/WidgetUtils";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { NumberInputStepButtonPosition } from "widgets/BaseInputWidget/constants";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { LabelPosition } from "components/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { DynamicHeight } from "utils/WidgetFeatures";
import { getDefaultCurrency } from "../component/CurrencyCodeDropdown";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import captureException from "instrumentation/sendFaroErrors";

export function defaultValueValidation(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  props: CurrencyInputWidgetProps,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _?: any,
): ValidationResponse {
  const NUMBER_ERROR_MESSAGE = {
    name: "TypeError",
    message: "This value must be number",
  };
  const DECIMAL_SEPARATOR_ERROR_MESSAGE = {
    name: "ValidationError",
    message: "Please use . as the decimal separator for default values.",
  };
  const EMPTY_ERROR_MESSAGE = {
    name: "",
    message: "",
  };
  const localeLang = navigator.languages?.[0] || "en-US";

  function getLocaleDecimalSeperator() {
    return Intl.NumberFormat(localeLang)
      .format(1.1)
      .replace(/\p{Number}/gu, "");
  }

  const decimalSeperator = getLocaleDecimalSeperator();
  const defaultDecimalSeperator = ".";

  if (_.isObject(value)) {
    return {
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [NUMBER_ERROR_MESSAGE],
    };
  }

  if (_.isBoolean(value) || _.isUndefined(value) || _.isNull(value)) {
    return {
      isValid: false,
      parsed: value,
      messages: [NUMBER_ERROR_MESSAGE],
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any = Number(value);
  let isValid, messages;

  if (_.isString(value) && value.trim() === "") {
    /*
     *  When value is empty string
     */
    isValid = true;
    messages = [EMPTY_ERROR_MESSAGE];
    parsed = undefined;
  } else if (!Number.isFinite(parsed)) {
    /*
     *  When parsed value is not a finite numer
     */
    isValid = false;
    parsed = undefined;

    /**
     * Check whether value contains the locale decimal separator apart from "."
     * We only allow "." as a decimal separator inside default value
     */
    if (
      String(value).indexOf(defaultDecimalSeperator) === -1 &&
      String(value).indexOf(decimalSeperator) > 0
    ) {
      messages = [DECIMAL_SEPARATOR_ERROR_MESSAGE];
    } else {
      messages = [NUMBER_ERROR_MESSAGE];
    }
  } else {
    /*
     *  When parsed value is a Number
     */

    // Check whether value is honoring the decimals property
    if (parsed !== Number(parsed.toFixed(props.decimals))) {
      isValid = false;
      messages = [
        {
          name: "RangeError",
          message:
            "No. of decimals are higher than the decimals field set. Please update the default or the decimals field",
        },
      ];
    } else {
      isValid = true;
      messages = [EMPTY_ERROR_MESSAGE];
    }

    parsed = String(parsed);
  }

  return {
    isValid,
    parsed,
    messages,
  };
}

class CurrencyInputWidget extends BaseInputWidget<
  CurrencyInputWidgetProps,
  WidgetState
> {
  static type = "CURRENCY_INPUT_WIDGET";

  static getConfig() {
    return {
      name: "Currency Input",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.INPUTS],
      needsMeta: true,
      searchTags: ["amount", "total"],
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
      widgetName: "CurrencyInput",
      version: 1,
      rows: 7,
      labelPosition: LabelPosition.Top,
      allowCurrencyChange: false,
      defaultCurrencyCode: getDefaultCurrency().currency,
      decimals: 0,
      showStepArrows: false,
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
    };
  }

  static getAutoLayoutConfig() {
    return {
      disabledPropsDefaults: {
        labelPosition: LabelPosition.Top,
        labelTextSize: "0.875rem",
      },
      defaults: {
        rows: 6.6,
      },
      autoDimension: {
        height: true,
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
      disableResizeHandles: {
        vertical: true,
      },
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
    return {
      "!doc":
        "An input text field is used to capture a currency value. Inputs are used in forms and can have custom validations.",
      "!url": "https://docs.appsmith.com/widget-reference/currency-input",
      text: {
        "!type": "string",
        "!doc": "The formatted text value of the input",
        "!url": "https://docs.appsmith.com/widget-reference/currency-input",
      },
      value: {
        "!type": "number",
        "!doc": "The value of the input",
        "!url": "https://docs.appsmith.com/widget-reference/currency-input",
      },
      isValid: "bool",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      isDisabled: "bool",
      countryCode: {
        "!type": "string",
        "!doc": "Selected country code for Currency",
      },
      currencyCode: {
        "!type": "string",
        "!doc": "Selected Currency code",
      },
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

  static getPropertyPaneContentConfig() {
    return mergeWidgetConfig(
      [
        {
          sectionName: "Data",
          children: [
            {
              helpText:
                "Sets the default text of the widget. The text is updated if the default text changes",
              propertyName: "defaultText",
              label: "Default value",
              controlType: "INPUT_TEXT",
              placeholderText: "100",
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.FUNCTION,
                params: {
                  fn: defaultValueValidation,
                  expected: {
                    type: "number",
                    example: `100`,
                    autocompleteDataType: AutocompleteDataType.STRING,
                  },
                },
              },
              dependencies: ["decimals"],
            },
            {
              helpText: "Changes the type of currency",
              propertyName: "defaultCurrencyCode",
              label: "Currency",
              enableSearch: true,
              dropdownHeight: "156px",
              controlType: "DROP_DOWN",
              searchPlaceholderText: "Search by code or name",
              options: CurrencyDropdownOptions,
              virtual: true,
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.TEXT,
              },
            },
            {
              propertyName: "allowCurrencyChange",
              label: "Allow currency change",
              helpText: "Search by currency or country",
              controlType: "SWITCH",
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: { type: ValidationTypes.BOOLEAN },
            },
            {
              helpText: "No. of decimals in currency input",
              propertyName: "decimals",
              label: "Decimals allowed",
              controlType: "DROP_DOWN",
              options: [
                {
                  label: "0",
                  value: 0,
                },
                {
                  label: "1",
                  value: 1,
                },
                {
                  label: "2",
                  value: 2,
                },
                {
                  label: "3",
                  value: 3,
                },
                {
                  label: "4",
                  value: 4,
                },
                {
                  label: "5",
                  value: 5,
                },
                {
                  label: "6",
                  value: 6,
                },
              ],
              isJSConvertible: true,
              isBindProperty: true,
              isTriggerProperty: false,
              validation: {
                type: ValidationTypes.NUMBER,
                params: {
                  min: 0,
                  max: 6,
                },
              },
            },
          ],
        },
        {
          sectionName: "Label",
          children: [],
        },
        {
          sectionName: "Validation",
          children: [
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
          ],
        },
      ],
      super.getPropertyPaneContentConfig(),
    );
  }

  static getPropertyPaneStyleConfig() {
    return super.getPropertyPaneStyleConfig();
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{(()=>{${derivedProperties.isValid}})()}}`,
      value: `{{(()=>{${derivedProperties.value}})()}}`,
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return _.merge(super.getMetaPropertiesMap(), {
      text: undefined,
      currencyCode: undefined,
    });
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return _.merge(super.getDefaultPropertiesMap(), {
      currencyCode: "defaultCurrencyCode",
    });
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    };
  }

  componentDidMount() {
    //format the defaultText and store it in text
    this.formatText();
  }

  componentDidUpdate(prevProps: CurrencyInputWidgetProps) {
    if (
      prevProps.text !== this.props.text &&
      !this.props.isFocused &&
      this.props.text === String(this.props.defaultText)
    ) {
      this.formatText();
    }

    // If defaultText property has changed, reset isDirty to false
    if (
      this.props.defaultText !== prevProps.defaultText &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }

    if (
      this.props.currencyCode === this.props.defaultCurrencyCode &&
      prevProps.currencyCode !== this.props.currencyCode
    ) {
      this.onCurrencyTypeChange(this.props.currencyCode);
    }
  }

  formatText() {
    if (!!this.props.text && !this.isTextFormatted()) {
      try {
        /**
         * Since we are restricting default value to only have "." decimal separator,
         * hence we directly convert it to the current locale
         */
        const floatVal = parseFloat(this.props.text);

        const formattedValue = Intl.NumberFormat(getLocale(), {
          style: "decimal",
          minimumFractionDigits: this.props.decimals,
          maximumFractionDigits: this.props.decimals,
        }).format(floatVal);

        this.props.updateWidgetMetaProperty("text", formattedValue);
      } catch (e) {
        log.error(e);
        captureException(e, { errorName: "CurrencyInputWidget" });
      }
    }
  }

  onValueChange = (value: string) => {
    let formattedValue = "";
    const decimalSeperator = getLocaleDecimalSeperator();

    try {
      if (value && value.includes(decimalSeperator)) {
        formattedValue = limitDecimalValue(this.props.decimals, value);
      } else {
        formattedValue = value;
      }
    } catch (e) {
      formattedValue = value;
      log.error(e);
      captureException(e, { errorName: "CurrencyInputWidget" });
    }

    // text is stored as what user has typed
    this.props.updateWidgetMetaProperty("text", String(formattedValue), {
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

  isTextFormatted = () => {
    return this.props.text.includes(getLocaleThousandSeparator());
  };

  handleFocusChange = (isFocused?: boolean) => {
    try {
      if (isFocused) {
        const text = this.props.text || "";
        const deFormattedValue = text.replace(
          new RegExp("\\" + getLocaleThousandSeparator(), "g"),
          "",
        );

        this.props.updateWidgetMetaProperty("text", deFormattedValue);
        this.props.updateWidgetMetaProperty("isFocused", isFocused, {
          triggerPropertyName: "onFocus",
          dynamicString: this.props.onFocus,
          event: {
            type: EventType.ON_FOCUS,
          },
        });
      } else {
        if (this.props.text) {
          const formattedValue = formatCurrencyNumber(
            this.props.decimals,
            this.props.text,
          );

          this.props.updateWidgetMetaProperty("text", formattedValue);
        }

        this.props.updateWidgetMetaProperty("isFocused", isFocused, {
          triggerPropertyName: "onBlur",
          dynamicString: this.props.onBlur,
          event: {
            type: EventType.ON_BLUR,
          },
        });
      }
    } catch (e) {
      log.error(e);
      captureException(e, { errorName: "CurrencyInputWidget" });
      this.props.updateWidgetMetaProperty("text", this.props.text);
    }

    super.handleFocusChange(!!isFocused);
  };

  onCurrencyTypeChange = (currencyCode?: string) => {
    const countryCode = getCountryCodeFromCurrencyCode(currencyCode);

    this.props.updateWidgetMetaProperty("countryCode", countryCode);
    this.props.updateWidgetMetaProperty("currencyCode", currencyCode);
  };

  handleKeyDown = (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    super.handleKeyDown(e);
  };

  onStep = (direction: number) => {
    const value = Number(this.props.value) + direction;

    // Since value is always going to be a number therefore, directly converting it to the current locale
    const formattedValue = Intl.NumberFormat(getLocale()).format(value);

    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }

    this.props.updateWidgetMetaProperty("text", String(formattedValue), {
      triggerPropertyName: "onTextChanged",
      dynamicString: this.props.onTextChanged,
      event: {
        type: EventType.ON_TEXT_CHANGE,
      },
    });
  };

  getWidgetView() {
    const value = this.props.text ?? "";
    const isInvalid =
      "isValid" in this.props && !this.props.isValid && !!this.props.isDirty;
    const currencyCode = this.props.currencyCode;
    const conditionalProps: Partial<CurrencyInputComponentProps> = {};

    conditionalProps.errorMessage = this.props.errorMessage;

    if (this.props.isRequired && value.length === 0) {
      conditionalProps.errorMessage = createMessage(FIELD_REQUIRED_ERROR);
    }

    const { componentHeight } = this.props;

    if (this.props.showStepArrows) {
      conditionalProps.buttonPosition = NumberInputStepButtonPosition.RIGHT;
    } else {
      conditionalProps.buttonPosition = NumberInputStepButtonPosition.NONE;
    }

    return (
      <CurrencyInputComponent
        accentColor={this.props.accentColor}
        allowCurrencyChange={this.props.allowCurrencyChange}
        autoFocus={this.props.autoFocus}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        compactMode={isCompactMode(componentHeight)}
        currencyCode={currencyCode}
        decimals={this.props.decimals}
        defaultValue={this.props.defaultText}
        disableNewLineOnPressEnterKey={!!this.props.onSubmit}
        disabled={this.props.isDisabled}
        iconAlign={this.props.iconAlign}
        iconName={this.props.iconName}
        inputType={this.props.inputType}
        isDynamicHeightEnabled={isAutoHeightEnabledForWidget(this.props)}
        isInvalid={isInvalid}
        isLoading={this.props.isLoading}
        label={this.props.label}
        labelAlignment={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelWidth={this.props.labelComponentWidth}
        onCurrencyTypeChange={this.onCurrencyTypeChange}
        onFocusChange={this.handleFocusChange}
        onKeyDown={this.handleKeyDown}
        onStep={this.onStep}
        onValueChange={this.onValueChange}
        placeholder={this.props.placeholderText}
        renderMode={this.props.renderMode}
        showError={!!this.props.isFocused}
        tooltip={this.props.tooltip}
        value={value}
        widgetId={this.props.widgetId}
        {...conditionalProps}
      />
    );
  }
}

export interface CurrencyInputWidgetProps extends BaseInputWidgetProps {
  countryCode?: string;
  currencyCode?: string;
  noOfDecimals?: number;
  allowCurrencyChange?: boolean;
  decimals?: number;
  defaultText?: number;
}

export default CurrencyInputWidget;
