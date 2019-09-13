import * as React from "react";
import { ComponentProps } from "./BaseComponent";
import { IconName, InputGroup, Intent } from "@blueprintjs/core";
import { Container } from "./ContainerComponent";
class InputGroupComponent extends React.Component<InputGroupComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <InputGroup
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
      </Container>
    );
  }
}

export interface InputGroupComponentProps extends ComponentProps {
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

export default InputGroupComponent;
