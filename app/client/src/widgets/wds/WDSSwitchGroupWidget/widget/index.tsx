import React from "react";
import xor from "lodash/xor";
import BaseWidget from "widgets/BaseWidget";
import type { WidgetState } from "widgets/BaseWidget";
import { Switch, ToggleGroup } from "@appsmith/wds";
import type { SetterConfig } from "entities/AppTheming";
import type { AnvilConfig } from "WidgetProvider/types";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import {
  anvilConfig,
  autocompleteConfig,
  defaultsConfig,
  featuresConfig,
  metaConfig,
  propertyPaneContentConfig,
  settersConfig,
  methodsConfig,
} from "../config";
import type { SwitchGroupWidgetProps, OptionProps } from "./types";

class WDSSwitchGroupWidget extends BaseWidget<
  SwitchGroupWidgetProps,
  WidgetState
> {
  static type = "WDS_SWITCH_GROUP_WIDGET";

  static getConfig() {
    return metaConfig;
  }

  static getFeatures() {
    return featuresConfig;
  }

  static getDefaults() {
    return defaultsConfig;
  }

  static getAnvilConfig(): AnvilConfig | null {
    return anvilConfig;
  }

  static getAutocompleteDefinitions() {
    return autocompleteConfig;
  }

  static getSetterConfig(): SetterConfig {
    return settersConfig;
  }

  static getPropertyPaneContentConfig() {
    return propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedValues: "defaultSelectedValues",
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedValues: undefined,
      isDirty: false,
    };
  }

  static getMethods() {
    return methodsConfig;
  }

  componentDidUpdate(prevProps: SwitchGroupWidgetProps) {
    if (
      xor(this.props.defaultSelectedValues, prevProps.defaultSelectedValues)
        .length > 0 &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  onChange = (selectedValues: OptionProps["value"][]) => {
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    if (!this.props.isDirty) {
      pushBatchMetaUpdates("isDirty", true);
    }

    pushBatchMetaUpdates("selectedValues", selectedValues, {
      triggerPropertyName: "onSelectionChange",
      dynamicString: this.props.onSelectionChange,
      event: {
        type: EventType.ON_SWITCH_GROUP_SELECTION_CHANGE,
      },
    });
    commitBatchMetaUpdates();
  };

  getWidgetView() {
    const {
      disableWidgetInteraction,
      labelPosition,
      labelTooltip,
      options,
      selectedValues,
      widgetId,
      ...rest
    } = this.props;

    return (
      <ToggleGroup
        {...rest}
        contextualHelp={labelTooltip}
        onChange={this.onChange}
        value={selectedValues}
      >
        {options.map((option) => (
          <Switch
            excludeFromTabOrder={disableWidgetInteraction}
            key={`${widgetId}-option-${option.value}`}
            labelPosition={labelPosition}
            value={option.value}
          >
            {option.label}
          </Switch>
        ))}
      </ToggleGroup>
    );
  }
}

export { WDSSwitchGroupWidget };
