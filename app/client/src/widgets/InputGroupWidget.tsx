import * as React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { WidgetType, CSSUnits } from "../constants/WidgetConstants";
import InputGroupComponent from "../editorComponents/InputGroupComponent";
import { IconName, InputGroup, Intent } from "@blueprintjs/core";
import _ from "lodash";

class InputGroupWidget extends BaseWidget<
  IInputGroupWidgetProps,
  IWidgetState
> {
  constructor(widgetProps: IInputGroupWidgetProps) {
    super(widgetProps);
  }

  getPageView() {
    return (
      <InputGroupComponent
        style={{
          positionType: "ABSOLUTE",
          yPosition: this.props.topRow * this.props.parentRowSpace,
          xPosition: this.props.leftColumn * this.props.parentColumnSpace,
          xPositionUnit: CSSUnits.PIXEL,
          yPositionUnit: CSSUnits.PIXEL
        }}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        className={this.props.className}
        disabled={this.props.disabled}
        large={this.props.large}
        leftIcon={this.props.leftIcon}
        placeholder={this.props.placeholder}
        rightElement={this.props.rightElement}
        round={this.props.round}
        small={this.props.small}
        value={this.props.value}
        intent={this.props.intent}
        defaultValue={this.props.defaultValue}
        type={this.props.type}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "INPUT_GROUP_WIDGET";
  }
}

export interface IInputGroupWidgetProps extends IWidgetProps {
  className?: string;
  disabled?: boolean;
  large?: boolean;
  intent?: Intent;
  defaultValue?: string;
  leftIcon?: IconName;
  rightElement?: JSX.Element;
  round?: boolean;
  small?: boolean;
  type?: string;
  value?: string;
  placeholder?: string;
}

export default InputGroupWidget;
