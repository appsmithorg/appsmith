import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import CheckboxComponent from "components/designSystems/blueprint/CheckboxComponent";
import { EventType } from "constants/ActionConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/ValidationFactory";
import {
  TriggerPropertiesMap,
  DerivedPropertiesMap,
} from "utils/WidgetFactory";

class CheckboxWidget extends BaseWidget<CheckboxWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      label: VALIDATION_TYPES.TEXT,
      defaultCheckedState: VALIDATION_TYPES.BOOLEAN,
      // onCheckChange: VALIDATION_TYPES.ACTION_SELECTOR,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onCheckChange: true,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      isChecked: "defaultCheckedState",
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{this.isChecked}}`,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      isChecked: undefined,
    };
  }

  getPageView() {
    return (
      <CheckboxComponent
        isChecked={!!this.props.isChecked}
        label={this.props.label}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        isDisabled={this.props.isDisabled}
        onCheckChange={this.onCheckChange}
        isLoading={this.props.isLoading}
      />
    );
  }

  onCheckChange = (isChecked: boolean) => {
    this.updateWidgetMetaProperty("isChecked", isChecked);
    if (this.props.onCheckChange) {
      super.executeAction({
        dynamicString: this.props.onCheckChange,
        event: {
          type: EventType.ON_CHECK_CHANGE,
        },
      });
    }
  };

  getWidgetType(): WidgetType {
    return "CHECKBOX_WIDGET";
  }
}

export interface CheckboxWidgetProps extends WidgetProps {
  label: string;
  defaultCheckedState: boolean;
  isChecked?: boolean;
  isDisabled?: boolean;
  onCheckChange?: string;
}

export default CheckboxWidget;
