import React from "react";
import styled from "styled-components";
import { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { IconName, InputGroup, MaybeElement } from "@blueprintjs/core";
import { ComponentProps } from "./BaseComponent";

export const TextInput = styled(InputGroup)`
  flex: 1;
  & input {
    border: 1px solid ${props => props.theme.colors.inputInactiveBorders};
    border-radius: 4px;
    box-shadow: none;
    height: 32px;
    background-color: ${props => props.theme.colors.textOnDarkBG};
    &:focus {
      border-color: ${props => props.theme.colors.secondary};
      background-color: ${props => props.theme.colors.textOnDarkBG};
      outline: 0;
      box-shadow: none;
    }
  }
  &.bp3-input-group .bp3-input:not(:first-child) {
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
`;

const InputContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const ErrorText = styled.span`
  height: 10px;
  padding: 3px;
  font-size: 10px;
  color: ${props => props.theme.colors.error};
`;

export interface TextInputProps {
  placeholder?: string;
  input?: Partial<WrappedFieldInputProps>;
  meta?: WrappedFieldMetaProps;
  icon?: IconName | MaybeElement;
  showError?: boolean;
  className?: string;
}

export const BaseTextInput = (props: TextInputProps) => {
  const { placeholder, input, meta, icon, showError, className } = props;
  return (
    <InputContainer className={className}>
      <TextInput
        {...input}
        placeholder={placeholder}
        leftIcon={icon}
        autoComplete={"off"}
      />
      {showError && (
        <ErrorText>
          {meta && (meta.touched || meta.active) && meta.error}
        </ErrorText>
      )}
    </InputContainer>
  );
};

const TextInputComponent = (props: TextInputProps & ComponentProps) => {
  return <BaseTextInput {...props} />;
};

export default TextInputComponent;
