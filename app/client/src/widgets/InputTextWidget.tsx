import * as React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { WidgetType, CSSUnits } from "../constants/WidgetConstants";
import InputTextComponent from "../editorComponents/InputTextComponent";
import _ from "lodash";

class InputTextWidget extends BaseWidget<IInputTextWidgetProps, IWidgetState> {
  constructor(widgetProps: IInputTextWidgetProps) {
    super(widgetProps);
  }

  getWidgetView() {
    return (
      <InputTextComponent
        style={{
          positionType: "ABSOLUTE",
          yPosition: this.props.topRow * this.props.parentRowSpace,
          xPosition: this.props.leftColumn * this.props.parentColumnSpace,
          xPositionUnit: CSSUnits.PIXEL,
          yPositionUnit: CSSUnits.PIXEL
        }}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        placeholder={this.props.placeholder}
        id={this.props.id}
        type={this.props.type}
        required={this.props.required}
        minLength={this.props.minLength}
        maxLength={this.props.maxLength}
        size={this.props.size}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "TEXT_WIDGET";
  }
}

export interface IInputTextWidgetProps extends IWidgetProps {
  type?: string;
  id?: string;
  placeholder?: string;
  ellipsize?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  size?: number;
}

export default InputTextWidget;
