import React from "react";
import styled, { css } from "styled-components";
import { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { ComponentProps } from "../../editorComponents/BaseComponent";
import { Container } from "../../editorComponents/ContainerComponent";

const InputStyles = css`
  padding: 5px;
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
  const { placeholderMessage, multiline, input } = props;
  if (multiline) {
    return <TextArea placeholder={placeholderMessage} {...input} />;
  }
  return <Input placeholder={placeholderMessage} {...input} />;
};

const TextInputComponent = (props: TextInputProps & ComponentProps) => {
  return (
    <Container {...props}>
      <BaseTextInput {...props} />
    </Container>
  );
};

export default TextInputComponent;
