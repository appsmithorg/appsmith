import * as React from "react";
import { Button, MaybeElement } from "@blueprintjs/core";
import { TextComponentProps } from "./TextComponent";
import { Container } from "./ContainerComponent";

class ButtonComponent extends React.Component<ButtonComponentProps> {
  render() {
    console.log("button props", this.props);
    return (
      <Container {...this.props}>
        <Button icon={this.props.icon} onClick={this.props.onClick}>
          {this.props.text}
        </Button>
      </Container>
    );
  }
}

interface ButtonComponentProps extends TextComponentProps {
  icon?: MaybeElement;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export default ButtonComponent;
