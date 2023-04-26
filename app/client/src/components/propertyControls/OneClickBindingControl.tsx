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

  public onUpdatePropertyValue(value = "", makeDynamicPropertyPath?: boolean) {
    this.props.onPropertyChange?.(
      this.props.propertyName,
      value,
      false,
      makeDynamicPropertyPath,
    );
  }

  public render() {
    return (
      <WidgetQueryGeneratorForm
        entityId={this.props.widgetProperties.widgetId}
        expectedType={this.props.expected?.autocompleteDataType}
        onUpdate={(value?: string, makeDynamicPropertyPath?: boolean) =>
          this.onUpdatePropertyValue(value, makeDynamicPropertyPath)
        }
        propertyPath={this.props.propertyName}
        propertyValue={this.props.propertyValue}
        widgetId={this.props.widgetProperties.widgetId}
      />
    );
  }
}

export default OneClickBindingControl;

export type OneClickBindingControlProps = ControlProps;
