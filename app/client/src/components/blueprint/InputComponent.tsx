import * as React from "react";
import { ComponentProps } from "../appsmith/BaseComponent";
import {
  Intent,
  NumericInput,
  IconName,
  InputGroup,
  Button,
} from "@blueprintjs/core";
import { Container } from "../appsmith/ContainerComponent";
import { InputType } from "../../widgets/InputWidget";
/**
 * All design system component specific logic goes here.
 * Ex. Blueprint has a sperarate numeric input and text input so switching between them goes here
 * Ex. To set the icon as currency, blue print takes in a set of defined types
 * All generic logic like max characters for phone numbers should be 10, should go in the widget
 */

class InputComponent extends React.Component<
  InputComponentProps,
  InputComponentState
> {
  constructor(props: InputComponentProps) {
    super(props);
    this.state = { showPassword: false };
  }

  render() {
    return (
      <Container {...this.props}>
        {this.props.inputType === "INTEGER" ||
        this.props.inputType === "PHONE_NUMBER" ||
        this.props.inputType === "NUMBER" ||
        this.props.inputType === "CURRENCY" ? (
          <NumericInput
            placeholder={this.props.placeholder}
            min={this.props.minNum}
            max={this.props.maxNum}
            disabled={this.props.disabled}
            intent={this.props.intent}
            defaultValue={this.props.defaultValue}
            leftIcon={
              this.props.inputType === "PHONE_NUMBER"
                ? "phone"
                : this.props.leftIcon
            }
            type={this.props.inputType === "PHONE_NUMBER" ? "tel" : undefined}
            allowNumericCharactersOnly={true}
            stepSize={this.props.stepSize}
          />
        ) : this.props.inputType === "TEXT" ||
          this.props.inputType === "EMAIL" ||
          this.props.inputType === "PASSWORD" ||
          this.props.inputType === "SEARCH" ? (
          <InputGroup
            placeholder={this.props.placeholder}
            disabled={this.props.disabled}
            intent={this.props.intent}
            defaultValue={this.props.defaultValue}
            rightElement={
              this.props.inputType === "PASSWORD" ? (
                <Button
                  icon={"lock"}
                  onClick={() => {
                    this.setState({ showPassword: !this.state.showPassword });
                  }}
                />
              ) : (
                undefined
              )
            }
            type={
              this.props.inputType === "PASSWORD" && !this.state.showPassword
                ? "password"
                : this.props.inputType === "EMAIL"
                ? "email"
                : this.props.inputType === "SEARCH"
                ? "search"
                : "text"
            }
            leftIcon={
              this.props.inputType === "SEARCH"
                ? "search"
                : this.props.inputType === "EMAIL"
                ? "envelope"
                : this.props.leftIcon
            }
          />
        ) : (
          undefined
        )}
      </Container>
    );
  }
}

export interface InputComponentState {
  showPassword?: boolean;
}

export interface InputComponentProps extends ComponentProps {
  inputType?: InputType;
  disabled?: boolean;
  intent?: Intent;
  defaultValue?: string;
  leftIcon?: IconName;
  allowNumericCharactersOnly?: boolean;
  fill?: boolean;
  maxNum?: number;
  minNum?: number;
  onValueChange?: (valueAsNumber: number, valueAsString: string) => void;
  stepSize?: number;
  placeholder?: string;
}

export default InputComponent;
