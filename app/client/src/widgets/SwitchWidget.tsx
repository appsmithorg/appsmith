import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import {
  BASE_WIDGET_VALIDATION,
  WidgetPropertyValidationType,
} from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { SwitchComponent } from "components/designSystems/blueprint/SwitchComponent";
import { EventType } from "constants/ActionConstants";
import {
  DerivedPropertiesMap,
  TriggerPropertiesMap,
} from "utils/WidgetFactory";

class SwitchWidget extends BaseWidget<SwitchWidgetProps, WidgetState> {
  getPageView() {
    return (
      <SwitchComponent
        isOn={!!this.props.isOn}
        swapLabel={this.props.swapLabel}
        label={this.props.label}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        isDisabled={this.props.isDisabled}
        onSwitchChange={this.onSwitchChange}
        isLoading={this.props.isLoading}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "SWITCH_WIDGET";
  }

  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      label: VALIDATION_TYPES.TEXT,
      defaultSwitchState: VALIDATION_TYPES.BOOLEAN,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      isOn: "defaultSwitchState",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      isOn: undefined,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onSwitchChange: true,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{this.isOn}}`,
    };
  }

  onSwitchChange = (isOn: boolean) => {
    this.props.updateWidgetMetaProperty("isOn", isOn, {
      dynamicString: this.props.onSwitchChange,
      event: {
        type: EventType.ON_SWITCH_CHANGE,
      },
    });
  };
}

export interface SwitchWidgetProps extends WidgetProps, WithMeta {
  isOn: boolean;
  defaultSwitchState: boolean;
  swapLabel: boolean;
  label: string;
}

export default SwitchWidget;
export const ProfiledSwitchWidget = Sentry.withProfiler(withMeta(SwitchWidget));
