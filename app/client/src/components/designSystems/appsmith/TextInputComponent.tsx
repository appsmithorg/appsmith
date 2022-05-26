import React, { Component } from "react";
import styled from "styled-components";
import { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import {
  IconName,
  IInputGroupProps,
  IIntentProps,
  InputGroup,
  MaybeElement,
} from "@blueprintjs/core";
import { ComponentProps } from "widgets/BaseComponent";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const TextInput = styled(({ hasError, ...rest }) => (
  <InputGroup {...rest} />
))<{ hasError: boolean }>`
  flex: 1;
  & input {
    box-shadow: none;
    border-radius: 0;
    height: 36px;
    border: 1px solid
      ${(props) =>
        props.hasError ? props.theme.colors.error : props.theme.colors.border};
    background-color: ${(props) =>
      props.hasError ? Colors.FAIR_PINK : "#fff"};
    padding: 8px 12px 9px;
    color: ${(props) =>
      props.hasError ? Colors.DANGER_SOLID : Colors.CODE_GRAY};
    &:focus {
      border-color: ${(props) =>
        props.hasError
          ? props.theme.colors.error
          : "var(--appsmith-input-focus-border-color)"};
      background-color: ${(props) => props.theme.colors.textOnDarkBG};
      outline: 0;
      box-shadow: none;
    }
    &:hover {
      background: ${(props) => (props.hasError ? "" : "#FAFAFA")};
    }
  }
  &.bp3-input-group {
    .bp3-input:not(:first-child) {
      padding-left: 35px;
    }
    .bp3-icon {
      border-radius: 4px 0 0 4px;
      margin: 0;
      height: 32px;
      width: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #eef2f5;
      svg {
        height: 20px;
        width: 20px;
        path {
          fill: #979797;
        }
      }
    }
  }
`;

const TextInputError = styled.p`
  color: ${Colors.DANGER_SOLID};
  font-size: 12px;
  margin-top: 6px;
`;

const InputContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  position: relative;
`;

export interface TextInputProps extends IInputGroupProps {
  /** TextInput Placeholder */
  placeholder?: string;
  intent?: IIntentProps["intent"];
  input?: Partial<WrappedFieldInputProps>;
  meta?: Partial<WrappedFieldMetaProps>;
  icon?: IconName | MaybeElement;
  /** Should show error when defined */
  showError?: boolean;
  /** Additional classname */
  className?: string;
  type?: string;
  refHandler?: any;
  noValidate?: boolean;
  readonly?: boolean;
  autoFocus?: boolean;
}

interface TextInputState {
  inputIsFocused: boolean;
}

export class BaseTextInput extends Component<TextInputProps, TextInputState> {
  constructor(props: TextInputProps) {
    super(props);
    this.state = {
      inputIsFocused: false,
    };
  }

  handleFocus = (e: React.FocusEvent) => {
    this.setState({ inputIsFocused: true });
    if (this.props.input && this.props.input.onFocus) {
      this.props.input.onFocus(e);
    }
  };
  handleBlur = (e: React.FocusEvent) => {
    this.setState({ inputIsFocused: false });
    if (this.props.input && this.props.input.onBlur) {
      this.props.input.onBlur(e);
    }
  };
  render() {
    const {
      className,
      input,
      meta,
      refHandler,
      showError,
      ...rest
    } = this.props;
    const hasError = !!(
      showError &&
      meta &&
      (meta.touched || meta.active) &&
      meta.error
    );

    return (
      <InputContainer className={className}>
        <TextInput
          hasError={hasError}
          inputRef={refHandler}
          {...input}
          autoComplete={"off"}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          {...rest}
          className={replayHighlightClass}
          tabIndex={0}
        />
        {hasError && <TextInputError>{meta ? meta.error : ""}</TextInputError>}
      </InputContainer>
    );
  }
}

/**
 * Text Input Component
 * Has Icon, placholder, errors, etc.
 */
function TextInputComponent(props: TextInputProps & ComponentProps) {
  return <BaseTextInput {...props} />;
}

export default TextInputComponent;
