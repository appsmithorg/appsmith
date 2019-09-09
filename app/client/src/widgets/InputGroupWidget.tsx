import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import InputGroupComponent from "../editorComponents/InputGroupComponent";
import { IconName, Intent } from "@blueprintjs/core";

class InputGroupWidget extends BaseWidget<InputGroupWidgetProps, WidgetState> {
  getPageView() {
    return (
      <InputGroupComponent
        style={this.getPositionStyle()}
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

export interface InputGroupWidgetProps extends WidgetProps {
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
