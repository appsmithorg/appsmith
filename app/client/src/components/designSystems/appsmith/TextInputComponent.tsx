import React from "react";
import styled, { css } from "styled-components";
import { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { ComponentProps } from "./BaseComponent";
import { Container } from "./ContainerComponent";

const InputStyles = css`
  padding: ${props => `${props.theme.spaces[3]}px ${props.theme.spaces[1]}px`};
  flex: 1;
  border: 1px solid ${props => props.theme.colors.inputInactiveBorders};
  border-radius: 4px;
  height: 32px;
  background-color: ${props => props.theme.colors.textOnDarkBG};
  &:focus {
    border-color: ${props => props.theme.colors.secondary};
    background-color: ${props => props.theme.colors.textOnDarkBG};
    outline: 0;
  }
`;

const Input = styled.input`
  ${InputStyles}
`;

const InputContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const Error = styled.span`
  color: ${props => props.theme.colors.error};
  fontsize: ${props => props.theme.fontSizes[1]};
`;

const TextArea = styled.textarea`
  ${InputStyles}
  height: 100px;
`;

export interface TextInputProps {
  placeholderMessage?: string;
  multiline?: boolean;
  input?: WrappedFieldInputProps;
  meta?: WrappedFieldMetaProps;
}

export const BaseTextInput = (props: TextInputProps) => {
  const { placeholderMessage, multiline, input, meta } = props;
  if (multiline) {
    return <TextArea placeholder={placeholderMessage} {...input} />;
  }
  return (
    <InputContainer>
      <Input placeholder={placeholderMessage} {...input} />
      {meta && meta.touched && meta.error && <Error>{meta.error}</Error>}
    </InputContainer>
  );
};

const TextInputComponent = (props: TextInputProps & ComponentProps) => {
  return (
    <Container {...props}>
      <BaseTextInput {...props} />
    </Container>
  );
};

export default TextInputComponent;
