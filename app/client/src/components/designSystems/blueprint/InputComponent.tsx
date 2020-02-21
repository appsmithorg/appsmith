import React from "react";
import styled from "styled-components";
import { labelStyle } from "constants/DefaultTheme";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import {
  Intent,
  NumericInput,
  IconName,
  InputGroup,
  Button,
  Label,
  Text,
  Classes,
  ControlGroup,
  TextArea,
} from "@blueprintjs/core";
import { InputType } from "widgets/InputWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { Colors } from "constants/Colors";
/**
 * All design system component specific logic goes here.
 * Ex. Blueprint has a sperarate numeric input and text input so switching between them goes here
 * Ex. To set the icon as currency, blue print takes in a set of defined types
 * All generic logic like max characters for phone numbers should be 10, should go in the widget
 */

const InputComponentWrapper = styled(ControlGroup)<{ multiline: string }>`
  &&&& {
    .${Classes.INPUT} {
      box-shadow: none;
      border: 1px solid ${Colors.GEYSER_LIGHT};
      border-radius: ${props => props.theme.radii[1]}px;
      height: ${props => (props.multiline === "true" ? "100%" : "inherit")};
      &:active {
        border: 1px solid ${Colors.HIT_GRAY};
      }
      &:focus {
        border: 1px solid ${Colors.MYSTIC};
      }
    }
    .${Classes.INPUT_GROUP} {
      display: block;
      margin: 0;
    }
    .${Classes.CONTROL_GROUP} {
      justify-content: flex-start;
    }
    height: ${props => (props.multiline === "true" ? "100%" : "auto")};
    align-items: center;
    label {
      ${labelStyle}
      flex: 0 1 30%;
      margin: 7px ${WIDGET_PADDING * 2}px 0 0;
      text-align: right;
      align-self: flex-start;
    }
  }
`;

class InputComponent extends React.Component<
  InputComponentProps,
  InputComponentState
> {
  constructor(props: InputComponentProps) {
    super(props);
    this.state = { showPassword: false };
  }

  onTextChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    this.props.onValueChange(event.target.value);
  };

  onNumberChange = (valueAsNum: number, valueAsString: string) => {
    this.props.onValueChange(valueAsString);
  };

  isNumberInputType(inputType: InputType) {
    return (
      inputType === "INTEGER" ||
      inputType === "NUMBER" ||
      inputType === "CURRENCY"
    );
  }

  getIcon(inputType: InputType) {
    switch (inputType) {
      case "PHONE_NUMBER":
        return "phone";
      case "SEARCH":
        return "search";
      case "EMAIL":
        return "envelope";
      default:
        return undefined;
    }
  }

  getType(inputType: InputType) {
    switch (inputType) {
      case "PASSWORD":
        return this.state.showPassword ? "text" : "password";
      case "EMAIL":
        return "email";
      case "SEARCH":
        return "search";
      default:
        return "text";
    }
  }
  private numericInputComponent = () => (
    <NumericInput
      placeholder={this.props.placeholder}
      min={this.props.minNum}
      max={this.props.maxNum}
      maxLength={this.props.maxChars}
      disabled={this.props.disabled}
      intent={this.props.intent}
      className={this.props.isLoading ? "bp3-skeleton" : Classes.FILL}
      defaultValue={this.props.defaultValue}
      onValueChange={this.onNumberChange}
      leftIcon={
        this.props.inputType === "PHONE_NUMBER" ? "phone" : this.props.leftIcon
      }
      type={this.props.inputType === "PHONE_NUMBER" ? "tel" : undefined}
      allowNumericCharactersOnly
      stepSize={this.props.stepSize}
    />
  );
  private textAreaInputComponent = (
    <TextArea
      placeholder={this.props.placeholder}
      disabled={this.props.disabled}
      maxLength={this.props.maxChars}
      intent={this.props.intent}
      onChange={this.onTextChange}
      defaultValue={this.props.defaultValue}
      className={this.props.isLoading ? "bp3-skeleton" : ""}
      growVertically={false}
    />
  );

  private textInputComponent = (isTextArea: boolean) =>
    isTextArea ? (
      this.textAreaInputComponent
    ) : (
      <InputGroup
        placeholder={this.props.placeholder}
        disabled={this.props.disabled}
        maxLength={this.props.maxChars}
        intent={this.props.intent}
        onChange={this.onTextChange}
        defaultValue={this.props.defaultValue}
        className={this.props.isLoading ? "bp3-skeleton" : ""}
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
        type={this.getType(this.props.inputType)}
        leftIcon={this.getIcon(this.props.inputType)}
      />
    );
  private renderInputComponent = (inputType: InputType, isTextArea: boolean) =>
    this.isNumberInputType(inputType)
      ? this.numericInputComponent()
      : this.textInputComponent(isTextArea);

  render() {
    return (
      <InputComponentWrapper fill multiline={this.props.multiline.toString()}>
        {this.props.label && (
          <Label
            className={
              this.props.isLoading
                ? Classes.SKELETON
                : Classes.TEXT_OVERFLOW_ELLIPSIS
            }
          >
            {this.props.label}
          </Label>
        )}

        {this.renderInputComponent(this.props.inputType, this.props.multiline)}
        {this.props.errorMessage && <Text>{this.props.errorMessage}</Text>}
      </InputComponentWrapper>
    );
  }
}

export interface InputComponentState {
  showPassword?: boolean;
}

export interface InputComponentProps extends ComponentProps {
  inputType: InputType;
  disabled?: boolean;
  intent?: Intent;
  defaultValue?: string;
  label: string;
  leftIcon?: IconName;
  allowNumericCharactersOnly?: boolean;
  fill?: boolean;
  errorMessage?: string;
  maxChars?: number;
  maxNum?: number;
  minNum?: number;
  onValueChange: (valueAsString: string) => void;
  stepSize?: number;
  placeholder?: string;
  isLoading: boolean;
  multiline: boolean;
}

export default InputComponent;
