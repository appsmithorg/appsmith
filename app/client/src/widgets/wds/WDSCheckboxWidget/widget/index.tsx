import React from "react";
import { Checkbox } from "@appsmith/wds";
import type { SetterConfig } from "entities/AppTheming";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import * as config from "./../config";
import BaseWidget from "widgets/BaseWidget";
import type { CheckboxWidgetProps } from "./types";
import type { WidgetState } from "widgets/BaseWidget";
import type { AnvilConfig } from "WidgetProvider/constants";

class WDSCheckboxWidget extends BaseWidget<CheckboxWidgetProps, WidgetState> {
  static type = "WDS_CHECKBOX_WIDGET";

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

  static getPropertyPaneContentConfig() {
    return config.propertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      isChecked: "defaultCheckedState",
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{!!this.isChecked}}`,
      isValid: `{{ this.isRequired ? !!this.isChecked : true }}`,
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      isChecked: undefined,
      isDirty: false,
    };
  }

  static getSetterConfig(): SetterConfig {
    return config.settersConfig;
  }

  componentDidUpdate(prevProps: CheckboxWidgetProps) {
    if (
      this.props.defaultCheckedState !== prevProps.defaultCheckedState &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  onChange = (isChecked: boolean) => {
    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    if (!this.props.isDirty) {
      pushBatchMetaUpdates("isDirty", true);
    }

    pushBatchMetaUpdates("isChecked", isChecked, {
      triggerPropertyName: "onCheckChange",
      dynamicString: this.props.onCheckChange,
      event: {
        type: EventType.ON_CHECK_CHANGE,
      },
    });
    commitBatchMetaUpdates();
  };

  getWidgetView() {
    return (
      <Checkbox
        excludeFromTabOrder={this.props.disableWidgetInteraction}
        id={this.props.widgetId}
        isDisabled={this.props.isDisabled}
        isInvalid={!this.props.isValid}
        isRequired={this.props.isRequired}
        isSelected={!!this.props.isChecked}
        key={this.props.widgetId}
        onChange={this.onChange}
      >
        {this.props.label}
      </Checkbox>
    );
  }
}

export { WDSCheckboxWidget };
