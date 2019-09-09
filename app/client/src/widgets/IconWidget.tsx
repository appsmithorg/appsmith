import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import { Intent } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import IconComponent from "../editorComponents/IconComponent";

class IconWidget extends BaseWidget<IconWidgetProps, WidgetState> {
  getPageView() {
    return (
      <IconComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        icon={this.props.icon}
        iconSize={this.props.iconSize}
        intent={this.props.intent}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "ICON_WIDGET";
  }
}

export interface IconWidgetProps extends WidgetProps {
  icon?: IconName;
  iconSize?: number;
  ellipsize?: boolean;
  intent?: Intent;
}

export default IconWidget;
