import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import DatePickerComponent from "components/designSystems/blueprint/DatePickerComponent";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  DerivedPropertiesMap,
  TriggerPropertiesMap,
} from "utils/WidgetFactory";
import * as Sentry from "@sentry/react";

class DatePickerWidget extends BaseWidget<
  DatePickerWidgetProps,
  DatePickerWidgetState
> {
  constructor(props: DatePickerWidgetProps) {
    super(props);
    this.state = {
      selectedDate: props.selectedDate,
    };
  }
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      defaultDate: VALIDATION_TYPES.DATE,
      timezone: VALIDATION_TYPES.TEXT,
      enableTimePicker: VALIDATION_TYPES.BOOLEAN,
      dateFormat: VALIDATION_TYPES.TEXT,
      label: VALIDATION_TYPES.TEXT,
      datePickerType: VALIDATION_TYPES.TEXT,
      maxDate: VALIDATION_TYPES.DATE,
      minDate: VALIDATION_TYPES.DATE,
      isRequired: VALIDATION_TYPES.BOOLEAN,
      // onDateSelected: VALIDATION_TYPES.ACTION_SELECTOR,
      // onDateRangeSelected: VALIDATION_TYPES.ACTION_SELECTOR,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedDate : true }}`,
      value: `{{ this.selectedDate }}`,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onDateSelected: true,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedDate: "defaultDate",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedDate: undefined,
    };
  }

  componentDidUpdate(prevProps: DatePickerWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (
      prevProps.selectedDate !== this.props.selectedDate &&
      this.props.defaultDate === this.props.selectedDate
    ) {
      const selectedDate = this.props.selectedDate;
      this.setState({ selectedDate });
    }
  }

  getPageView() {
    return (
      <DatePickerComponent
        label={`${this.props.label}`}
        dateFormat={this.props.dateFormat}
        widgetId={this.props.widgetId}
        isDisabled={this.props.isDisabled}
        datePickerType={"DATE_PICKER"}
        onDateSelected={this.onDateSelected}
        selectedDate={this.state.selectedDate}
        isLoading={this.props.isLoading}
      />
    );
  }

  onDateSelected = (selectedDate: string) => {
    this.setState(
      {
        selectedDate,
      },
      () => {
        this.updateWidgetMetaProperty("selectedDate", selectedDate);
        if (this.props.onDateSelected) {
          super.executeAction({
            dynamicString: this.props.onDateSelected,
            event: {
              type: EventType.ON_DATE_SELECTED,
            },
          });
        }
      },
    );
  };

  getWidgetType(): WidgetType {
    return "DATE_PICKER_WIDGET";
  }
}

export type DatePickerType = "DATE_PICKER" | "DATE_RANGE_PICKER";

export interface DatePickerWidgetProps extends WidgetProps {
  defaultDate: string;
  selectedDate: string;
  isDisabled: boolean;
  dateFormat: string;
  label: string;
  datePickerType: DatePickerType;
  onDateSelected?: string;
  onDateRangeSelected?: string;
  maxDate: Date;
  minDate: Date;
  isRequired?: boolean;
}

export interface DatePickerWidgetState extends WidgetState {
  selectedDate: string;
}

export default DatePickerWidget;
export const ProfiledDatePickerWidget = Sentry.withProfiler(DatePickerWidget);
