import React from "react";
import { format, parseISO } from "date-fns";
import BaseWidget from "widgets/BaseWidget";
import type { WidgetState } from "widgets/BaseWidget";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { parseDateTime } from "@internationalized/date";
import { DatePicker, type DateValue } from "@appsmith/wds";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import * as config from "../config";
import { validateInput } from "./helpers";
import derivedPropertyFns from "./derived";
import type { WDSDatePickerWidgetProps } from "./types";
import { parseDerivedProperties } from "widgets/WidgetUtils";

class WDSDatePickerWidget extends BaseWidget<
  WDSDatePickerWidgetProps,
  WidgetState
> {
  static type = "WDS_DATEPICKER_WIDGET";

  static getConfig() {
    return config.metaConfig;
  }

  static getDefaults() {
    return config.defaultsConfig;
  }

  static getMethods() {
    return config.methodsConfig;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return config.anvilConfig;
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return config.autocompleteConfig;
  }

  static getPropertyPaneContentConfig() {
    return config.propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getDerivedPropertiesMap() {
    const parsedDerivedProperties = parseDerivedProperties(derivedPropertyFns);

    return {
      isValid: `{{(() => {${parsedDerivedProperties.isValid}})()}}`,
      selectedDate: `{{ this.value ? format(parseISO(this.value), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : "" }}`,
      formattedDate: `{{ this.value ? format(parseISO(this.value), this.dateFormat) : "" }}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      value: "defaultDate",
    };
  }

  static getMetaPropertiesMap() {
    return {
      value: undefined,
      isDirty: false,
    };
  }

  static getStylesheetConfig() {
    return {};
  }

  static getSetterConfig() {
    return config.settersConfig;
  }

  static getDependencyMap() {
    return {};
  }

  componentDidUpdate(prevProps: WDSDatePickerWidgetProps): void {
    if (!this.shouldResetDirtyState(prevProps)) {
      return;
    }

    this.resetDirtyState();
  }

  handleDateChange = (date: DateValue) => {
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }

    this.props.updateWidgetMetaProperty("value", date.toString(), {
      triggerPropertyName: "onDateSelected",
      dynamicString: this.props.onDateSelected,
      event: {
        type: EventType.ON_DATE_SELECTED,
      },
    });
  };

  private shouldResetDirtyState(prevProps: WDSDatePickerWidgetProps): boolean {
    const { defaultDate, isDirty } = this.props;
    const hasDefaultDateChanged = defaultDate !== prevProps.defaultDate;

    return hasDefaultDateChanged && isDirty;
  }

  private resetDirtyState() {
    this.props.updateWidgetMetaProperty("isDirty", false);
  }

  private parseDate(date: string | undefined) {
    return date
      ? parseDateTime(format(parseISO(date), "yyyy-MM-dd'T'HH:mm:ss"))
      : undefined;
  }

  getWidgetView() {
    const { label, labelTooltip, maxDate, minDate, value, ...rest } =
      this.props;
    const { errorMessage, validationStatus } = validateInput(this.props);

    return (
      <DatePicker
        contextualHelp={labelTooltip}
        errorMessage={errorMessage}
        granularity={this.props.timePrecision}
        isInvalid={validationStatus === "invalid"}
        label={label}
        maxValue={this.parseDate(maxDate)}
        minValue={this.parseDate(minDate)}
        onChange={this.handleDateChange}
        value={this.parseDate(value)}
        {...rest}
      />
    );
  }
}

export { WDSDatePickerWidget };
