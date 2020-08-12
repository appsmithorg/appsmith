import React, { forwardRef, useCallback, useMemo } from "react";
import { CommonComponentProps } from "./common";
import styled from "styled-components";
import Text, { TextType } from "./Text";
import { hexToRgba } from "./Button";
import { theme } from "../../constants/DefaultTheme";

export type TextInputProps = CommonComponentProps & {
  value: string;
  placeholder?: string;
  fill?: boolean;
  validator?: (value: string) => { isValid: boolean; message: string };
  onChange?: (value: string) => void;
};

type boxReturnType = {
  bgColor: string;
  color: string;
  borderColor: string;
  boxShadow: string;
};

const boxStyles = (
  props: TextInputProps,
  inputState: string,
): boxReturnType => {
  let bgColor = theme.colors.blackShades[0];
  let color = theme.colors.blackShades[9];
  let borderColor = theme.colors.blackShades[0];
  let boxShadow = "";

  if (props.isDisabled) {
    bgColor = theme.colors.blackShades[2];
    color = theme.colors.blackShades[6];
    borderColor = theme.colors.blackShades[2];
  }
  if (props.validator && !props.validator(props.value).isValid) {
    bgColor = hexToRgba(theme.colors.danger.main, 0.1);
    color = theme.colors.danger.main;
    borderColor = theme.colors.danger.main;
  }
  if (
    inputState === "focus" &&
    props.validator &&
    props.validator(props.value).isValid
  ) {
    borderColor = theme.colors.info.main;
    boxShadow = "0px 0px 0px 4px rgba(203, 72, 16, 0.18)";
  }
  return { bgColor, color, borderColor, boxShadow };
};

const StyledInput = styled.input<
  TextInputProps & { mainState: boxReturnType; focusState: boxReturnType }
>`
  width: ${props => (props.fill ? "100%" : "260px")};
  border-radius: 0;
  outline: 0;
  box-shadow: none;
  margin-bottom: ${props => props.theme.spaces[1]}px;
  border: 1.2px solid ${props => props.mainState.borderColor};
  font-family: ${props => props.theme.fonts[3]};
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  background-color: ${props => props.mainState.bgColor};
  color: ${props => props.mainState.color};

  &::placeholder {
    color: ${props => props.theme.colors.blackShades[5]};
  }
  &:focus {
    border: 1.2px solid ${props => props.focusState.borderColor};
    box-shadow: ${props => props.focusState.boxShadow};
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

const TextInput = (props: TextInputProps) => {
  const mainState = useMemo(() => boxStyles(props, "main"), [
    props.isDisabled,
    props.validator,
  ]);
  const focusState = useMemo(() => boxStyles(props, "focus"), [
    props.isDisabled,
    props.validator,
  ]);

  const memoizedChangeHandler = useCallback(
    el => props.onChange && props.onChange(el.target.value),
    [props.value],
  );

  const ErrorMessage = (
    <Text type={TextType.P3}>
      {props.validator ? props.validator(props.value).message : ""}
    </Text>
  );

  return (
    <InputWrapper>
      <StyledInput
        type="text"
        mainState={mainState}
        focusState={focusState}
        {...props}
        placeholder={props.placeholder ? props.placeholder : ""}
        onChange={memoizedChangeHandler}
      />
      {props.validator && props.validator(props.value).isValid
        ? null
        : ErrorMessage}
    </InputWrapper>
  );
};

TextInput.defaultProps = {
  fill: false,
};

export default TextInput;
