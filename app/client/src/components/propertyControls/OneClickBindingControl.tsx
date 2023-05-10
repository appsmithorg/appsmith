import WidgetQueryGeneratorForm from "components/editorComponents/WidgetQueryGeneratorForm";
import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
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
  // static canDisplayValueInUI(config: ControlData, value: string): boolean {
  //   return /^{{[^.]*\.data}}$/gi.test(value);
  // }

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

  public onSourceClose = () => {
    if (this.props.widgetProperties.isConnectDataEnabled) {
      this.updateProperty?.("isConnectDataEnabled", false);
    }
  };

  private getErrorMessage = () => {
    const errorObj =
      this.props.widgetProperties.__evaluation__.errors[
        this.props.propertyName
      ];

    if (errorObj && errorObj.length && errorObj[0].errorMessage) {
      return errorObj[0].errorMessage.message;
    } else {
      return "";
    }
  };

  public render() {
    return (
      <WidgetQueryGeneratorForm
        entityId={this.props.widgetProperties.widgetId}
        errorMsg={this.getErrorMessage()}
        expectedType={this.props.expected?.autocompleteDataType}
        isSourceOpen={this.props.widgetProperties.isConnectDataEnabled}
        onSourceClose={this.onSourceClose}
        onUpdate={this.onUpdatePropertyValue}
        propertyPath={this.props.propertyName}
        propertyValue={this.props.propertyValue}
        widgetId={this.props.widgetProperties.widgetId}
      />
    );
  }
}

export default OneClickBindingControl;

export type OneClickBindingControlProps = ControlProps;
