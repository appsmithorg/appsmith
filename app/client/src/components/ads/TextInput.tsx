import React from "react";
import { CommonComponentProps } from "./common";
import styled, { css } from "styled-components";
import { ThemeProp, hexToRgba } from "./Button";
import AdsText, { TextType } from "./Text";

export type TextInputProps = CommonComponentProps & {
  value: string;
  placeholder?: string;
  fill?: boolean;
  validator?: (value: string) => { isValid: boolean; message: string };
  onChange?: (value: string) => void;
};

TextInput.defaultProps = {
  fill: true,
};

const setStyles = (props: TextInputProps & ThemeProp, inputState: string) => {
  let bgColor = props.theme.colors.blackShades[0];
  let color = props.theme.colors.blackShades[9];
  let borderColor = props.theme.colors.blackShades[0];
  let boxShadow;

  if (props.isDisabled) {
    bgColor = props.theme.colors.blackShades[2];
    color = props.theme.colors.blackShades[6];
    borderColor = props.theme.colors.blackShades[2];
  }
  if (props.validator && !props.validator(props.value).isValid) {
    bgColor = hexToRgba(props.theme.colors.danger.main, 0.1);
    color = props.theme.colors.danger.main;
    borderColor = props.theme.colors.danger.main;
  }
  if (
    inputState === "focus" &&
    props.validator &&
    props.validator(props.value).isValid
  ) {
    borderColor = props.theme.colors.info.main;
    boxShadow = "0px 0px 0px 4px rgba(203, 72, 16, 0.18)";
  }
  return { bgColor, color, borderColor, boxShadow };
};

const StyledInput = styled.input<TextInputProps>`
  width: ${props => (props.fill ? "100%" : "260px")};
  border-radius: 0;
  outline: 0;
  box-shadow: none;
  margin-bottom: ${props => props.theme.spaces[1]}px;
  border: 1.2px solid ${props => setStyles(props, "main").borderColor};
  font-family: ${props => props.theme.fonts[3]};
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  background-color: ${props => setStyles(props, "main").bgColor};
  color: ${props => setStyles(props, "main").color};

  &::placeholder {
    color: ${props => props.theme.colors.blackShades[5]};
  }
  &:focus {
    border: 1.2px solid ${props => setStyles(props, "focus").borderColor};
    box-shadow: ${props => setStyles(props, "focus").boxShadow};
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

function TextInput(props: TextInputProps): JSX.Element {
  const ErrorMessage = (
    <AdsText type={TextType.p3}>
      {props.validator ? props.validator(props.value).message : ""}
    </AdsText>
  );

  return (
    <InputWrapper>
      <StyledInput
        type="text"
        {...props}
        disabled={props.isDisabled}
        placeholder={props.placeholder ? props.placeholder : "placeholder"}
        onChange={() => props.onChange && props.onChange(props.value)}
      />
      {props.validator && props.validator(props.value).isValid
        ? null
        : ErrorMessage}
    </InputWrapper>
  );
}

export default TextInput;
