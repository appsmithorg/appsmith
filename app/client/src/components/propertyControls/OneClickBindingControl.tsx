import WidgetQueryGeneratorForm from "components/editorComponents/WidgetQueryGeneratorForm";
import type {
  Alias,
  OtherField,
} from "components/editorComponents/WidgetQueryGeneratorForm/types";
import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import {
  TABLE_CONNECT_BUTTON_TEXT,
  createMessage,
} from "@appsmith/constants/messages";

class OneClickBindingControl extends BaseControl<OneClickBindingControlProps> {
  constructor(props: OneClickBindingControlProps) {
    super(props);
  }

  static getControlType() {
    return "ONE_CLICK_BINDING_CONTROL";
  }

  /*
   * Commenting out as we're not able to switch between the js modes without value being overwritten
   * with default value by platform
   */
  static canDisplayValueInUI(
    config: OneClickBindingControlProps,
    value: any,
  ): boolean {
    // {{query1.data}} || sample data
    return (
      /^{{[^.]*\.data}}$/gi.test(value) ||
      config.controlConfig?.sampleData === value
    );
  }

  static shouldValidateValueOnDynamicPropertyOff() {
    return false;
  }

  public onUpdatePropertyValue = (
    value = "",
    makeDynamicPropertyPath?: boolean,
  ) => {
    this.props.onPropertyChange?.(
      this.props.propertyName,
      value,
      false,
      makeDynamicPropertyPath,
    );
  };

  private getErrorMessage = () => {
    const errorObj =
      this.props.widgetProperties.__evaluation__?.errors?.[
        this.props.propertyName
      ];

    if (errorObj?.[0]?.errorMessage) {
      return errorObj[0].errorMessage.message;
    } else {
      return "";
    }
  };

  public render() {
    return (
      <WidgetQueryGeneratorForm
        aliases={this.props.controlConfig.aliases}
        allowFieldConfigurations={
          this.props.controlConfig?.allowFieldConfigurations
        }
        ctaText={
          this.props.controlConfig.ctaText ||
          createMessage(TABLE_CONNECT_BUTTON_TEXT)
        }
        errorMsg={this.getErrorMessage()}
        excludePrimaryColumn={this.props.controlConfig?.excludePrimaryColumn}
        expectedType={this.props.expected?.autocompleteDataType || ""}
        onUpdate={this.onUpdatePropertyValue}
        otherFields={this.props.controlConfig.otherFields}
        propertyPath={this.props.propertyName}
        propertyValue={this.props.propertyValue}
        sampleData={this.props.controlConfig.sampleData}
        searchableColumn={this.props.controlConfig.searchableColumn}
        widgetId={this.props.widgetProperties.widgetId}
      />
    );
  }
}

export default OneClickBindingControl;

export type OneClickBindingControlProps = ControlProps & {
  controlConfig: {
    aliases: Alias[];
    allowFieldConfigurations: boolean;
    ctaText: string;
    excludePrimaryColumn: boolean;
    otherFields: OtherField[];
    sampleData: string;
    searchableColumn: boolean;
  };
};
