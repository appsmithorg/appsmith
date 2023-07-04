import WidgetQueryGeneratorForm from "components/editorComponents/WidgetQueryGeneratorForm";
import React from "react";
import type { ControlData, ControlProps } from "./BaseControl";
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
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    // {{query1.data}}
    return /^{{[^.]*\.data}}$/gi.test(value);
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
        errorMsg={this.getErrorMessage()}
        expectedType={this.props.expected?.autocompleteDataType || ""}
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
