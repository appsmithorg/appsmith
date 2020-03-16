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
import { TriggerPropertiesMap } from "utils/WidgetFactory";

class CheckboxWidget extends BaseWidget<CheckboxWidgetProps, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      label: VALIDATION_TYPES.TEXT,
      defaultCheckedState: VALIDATION_TYPES.BOOLEAN,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onCheckChange: true,
    };
  }

  componentDidMount() {
    super.componentDidMount();
    if (this.props.defaultCheckedState) {
      this.updateWidgetMetaProperty(
        "isChecked",
        this.props.defaultCheckedState,
      );
    }
  }

  componentDidUpdate(prevProps: CheckboxWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (this.props.defaultCheckedState.toString()) {
      if (
        (this.props.isChecked !== prevProps.isChecked &&
          this.props.isChecked === undefined) ||
        this.props.defaultCheckedState.toString() !==
          prevProps.defaultCheckedState.toString()
      ) {
        this.updateWidgetMetaProperty(
          "isChecked",
          this.props.defaultCheckedState,
        );
      }
    }
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
