import * as React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { WidgetType, CSSUnits } from "../constants/WidgetConstants";
import { Icon, Intent } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import IconComponent from "../editorComponents/IconComponent";
import _ from "lodash";

class IconWidget extends BaseWidget<IIconWidgetProps, IWidgetState> {
  constructor(widgetProps: IIconWidgetProps) {
    super(widgetProps);
  }

  getWidgetView() {
    return (
      <IconComponent
        style={{
          positionType: "ABSOLUTE",
          yPosition: this.props.topRow * this.props.parentRowSpace,
          xPosition: this.props.leftColumn * this.props.parentColumnSpace,
          xPositionUnit: CSSUnits.PIXEL,
          yPositionUnit: CSSUnits.PIXEL
        }}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        icon={this.props.icon}
        iconSize={this.props.iconSize}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "ICON_WIDGET";
  }
}

export interface IIconWidgetProps extends IWidgetProps {
  icon?: IconName;
  iconSize?: number;
  ellipsize?: boolean;
  intent?: Intent;
}

export default IconWidget;
