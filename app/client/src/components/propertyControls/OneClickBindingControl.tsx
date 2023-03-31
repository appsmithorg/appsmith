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

  public render() {
    return <WidgetQueryGeneratorForm />;
  }
}

export type OneClickBindingControlProps = ControlProps;

export default OneClickBindingControl;
