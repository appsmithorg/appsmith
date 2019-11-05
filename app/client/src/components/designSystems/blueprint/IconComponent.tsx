import * as React from "react";
import { ComponentProps } from "../appsmith/BaseComponent";
import { Icon, Intent } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import { Container } from "../appsmith/ContainerComponent";
class IconComponent extends React.Component<IconComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <Icon
          icon={this.props.icon}
          iconSize={this.props.iconSize}
          intent={this.props.intent}
        />
      </Container>
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
