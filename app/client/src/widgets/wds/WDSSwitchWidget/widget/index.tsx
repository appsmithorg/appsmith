import React from "react";
import { Switch } from "@appsmith/wds";
import type { SetterConfig } from "entities/AppTheming";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import * as config from "./../config";
import BaseWidget from "widgets/BaseWidget";
import type { SwitchWidgetProps } from "./types";
import type { WidgetState } from "widgets/BaseWidget";
import type { AnvilConfig } from "WidgetProvider/constants";

class WDSSwitchWidget extends BaseWidget<SwitchWidgetProps, WidgetState> {
  static type = "WDS_SWITCH_WIDGET";

  static getConfig() {
    return config.metaConfig;
  }

  static getFeatures() {
    return config.featuresConfig;
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

  static getAutocompleteDefinitions() {
    return config.autocompleteConfig;
  }

  static getSetterConfig(): SetterConfig {
    return config.settersConfig;
  }

  static getPropertyPaneContentConfig() {
    return config.propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      isSwitchedOn: "defaultSwitchState",
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{!!this.isSwitchedOn}}`,
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      isSwitchedOn: undefined,
      isDirty: false,
    };
  }

  componentDidUpdate(prevProps: SwitchWidgetProps) {
    if (
      this.props.defaultSwitchState !== prevProps.defaultSwitchState &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  onChange = (isSwitchedOn: boolean) => {
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    if (!this.props.isDirty) {
      pushBatchMetaUpdates("isDirty", true);
    }

    pushBatchMetaUpdates("isSwitchedOn", isSwitchedOn, {
      triggerPropertyName: "onChange",
      dynamicString: this.props.onChange,
      event: {
        type: EventType.ON_SWITCH_CHANGE,
      },
    });
    commitBatchMetaUpdates();
  };

  getWidgetView() {
    return (
      <Switch
        excludeFromTabOrder={this.props.disableWidgetInteraction}
        id={this.props.widgetId}
        isDisabled={this.props.isDisabled}
        isInvalid={this.props.isValid === "invalid"}
        isSelected={this.props.isSwitchedOn}
        key={this.props.widgetId}
        labelPosition={this.props.labelPosition}
        onChange={this.onChange}
      >
        {this.props.label}
      </Switch>
    );
  }
}

export { WDSSwitchWidget };
