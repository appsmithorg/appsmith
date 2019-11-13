import * as React from "react";
import { ComponentProps } from "../appsmith/BaseComponent";
import { Icon, Intent } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
class IconComponent extends React.Component<IconComponentProps> {
  render() {
    return (
      <Icon
        icon={this.props.icon}
        iconSize={this.props.iconSize}
        intent={this.props.intent}
      />
    );
  }
}

export interface IconComponentProps extends ComponentProps {
  iconSize?: number;
  icon?: IconName;
  intent?: Intent;
  ellipsize?: boolean;
}

export default IconComponent;
