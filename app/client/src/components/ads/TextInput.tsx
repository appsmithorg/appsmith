import React from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import { ThemeProp, rgbaIntensity } from "./Button";
// import AdsText, { TextType } from "./Text";

export type TextInputProps = CommonComponentProps & {
  placeholder?: string;
  value: string;
  hasError: boolean;
  validator: (value: string) => { isValid: boolean; message: string };
  onChange: (value: string) => void;
};

const setStyles = (props: TextInputProps & ThemeProp) => {
  let bgColor = props.theme.colors.blackShades[0];
  let color = props.theme.colors.blackShades[9];
  let borderColor = props.theme.colors.blackShades[0];

  if (props.isDisabled) {
    bgColor = props.theme.colors.blackShades[2];
    color = props.theme.colors.blackShades[6];
    borderColor = props.theme.colors.blackShades[2];
  }
  if (props.hasError || !props.validator(props.value).isValid) {
    bgColor = rgbaIntensity(props.theme.colors.danger.main, 0.1);
    color = props.theme.colors.danger.main;
    borderColor = props.theme.colors.danger.main;
  }
  return { bgColor, color, borderColor };
};

const StyledInput = styled.input<TextInputProps>`
  width: 50%;
  border-radius: 0;
  outline: 0;
  box-shadow: none;
  margin-bottom: ${props => props.theme.spaces[1]}px;
  border: 1.2px solid ${props => setStyles(props).borderColor};
  font-family: ${props => props.theme.fonts[3]};
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  background-color: ${props => setStyles(props).bgColor};
  color: ${props => setStyles(props).color};
  &::placeholder {
    color: ${props => props.theme.colors.blackShades[5]};
  }
  &:focus {
    border: 1.2px solid ${props => props.theme.colors.info.main};
  }
  &:disabled {
    cursor: not-allowed;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  span {
    color: ${props => props.theme.colors.danger.main};
  }
`;

const TextInput = (props: TextInputProps): JSX.Element => {
  const ErrorMessage = (
    <span>{props.validator(props.value).message}</span>
    // <AdsText type={TextType.p3}>{props.validator(props.value).message}</AdsText>
  );

  return (
    <InputWrapper>
      <StyledInput
        type="text"
        {...props}
        disabled={props.isDisabled}
        placeholder={props.placeholder ? props.placeholder : "placeholder"}
        onChange={() => props.onChange(props.value)}
      />
      {props.validator(props.value).isValid ? null : ErrorMessage}
    </InputWrapper>
  );
};

export default TextInput;
