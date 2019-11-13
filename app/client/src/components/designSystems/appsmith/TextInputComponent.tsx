import React from "react";
import styled from "styled-components";
import { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { FormGroup, IconName, InputGroup, Intent } from "@blueprintjs/core";
import { ComponentProps } from "./BaseComponent";

const TextInput = styled(InputGroup)`
  flex: 1;
  input {
    border: 1px solid ${props => props.theme.colors.inputInactiveBorders};
    border-radius: 4px;
    box-shadow: none;
    height: 38px;
    background-color: ${props => props.theme.colors.textOnDarkBG};
    &:focus {
      border-color: ${props => props.theme.colors.secondary};
      background-color: ${props => props.theme.colors.textOnDarkBG};
      outline: 0;
    }
  }
  .bp3-icon {
    border-radius: 4px 0 0 4px;
    margin: 0;
    height: 38px;
    width: 30px;
    background-color: ${props => props.theme.colors.menuButtonBGInactive};
    display: flex;
    align-items: center;
    justify-content: center;
    svg {
      height: 20px;
      width: 20px;
      path {
        fill: ${props => props.theme.colors.textDefault};
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
  placeholderMessage?: string;
  input?: Partial<WrappedFieldInputProps>;
  meta?: WrappedFieldMetaProps;
  icon?: IconName;
}

export const BaseTextInput = (props: TextInputProps) => {
  const { placeholderMessage, input, meta, icon } = props;
  return (
    <InputContainer>
      <TextInput {...input} placeholder={placeholderMessage} leftIcon={icon} />
      <ErrorText>{meta && meta.touched && meta.error}</ErrorText>
    </InputContainer>
  );
};

const TextInputComponent = (props: TextInputProps & ComponentProps) => {
  return <BaseTextInput {...props} />;
};

export default TextInputComponent;
