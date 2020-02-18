import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import CheckboxComponent from "components/designSystems/blueprint/CheckboxComponent";
import { EventType } from "constants/ActionConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { TriggerPropertiesMap } from "utils/WidgetFactory";

class CheckboxWidget extends BaseWidget<CheckboxWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      isDisabled: VALIDATION_TYPES.BOOLEAN,
      label: VALIDATION_TYPES.TEXT,
      defaultCheckedState: VALIDATION_TYPES.BOOLEAN,
      isChecked: VALIDATION_TYPES.BOOLEAN,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onCheckChange: true,
    };
  }

  getPageView() {
    return (
      <CheckboxComponent
        defaultCheckedState={this.props.defaultCheckedState}
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
    this.updateWidgetProperty("isChecked", isChecked);
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
