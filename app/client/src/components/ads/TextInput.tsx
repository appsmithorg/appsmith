import React, { forwardRef, Ref, useCallback, useMemo, useState } from "react";
import { CommonComponentProps, hexToRgba } from "./common";
import styled from "styled-components";
import Text, { TextType } from "./Text";
import { theme } from "constants/DefaultTheme";

export type TextInputProps = CommonComponentProps & {
  placeholder?: string;
  fill?: boolean;
  defaultValue?: string;
  validator?: (value: string) => { isValid: boolean; message: string };
  onChange?: (value: string) => void;
};

type boxReturnType = {
  bgColor: string;
  color: string;
  borderColor: string;
};

const boxStyles = (props: TextInputProps, isValid: boolean): boxReturnType => {
  let bgColor = theme.colors.blackShades[0];
  let color = theme.colors.blackShades[9];
  let borderColor = theme.colors.blackShades[0];

  if (props.disabled) {
    bgColor = theme.colors.blackShades[2];
    color = theme.colors.blackShades[6];
    borderColor = theme.colors.blackShades[2];
  }
  if (!isValid) {
    bgColor = hexToRgba(theme.colors.danger.main, 0.1);
    color = theme.colors.danger.main;
    borderColor = theme.colors.danger.main;
  }
  return { bgColor, color, borderColor };
};

const StyledInput = styled.input<
  TextInputProps & { inputStyle: boxReturnType; isValid: boolean }
>`
  width: ${props => (props.fill ? "100%" : "260px")};
  border-radius: 0;
  outline: 0;
  box-shadow: none;
  margin-bottom: ${props => props.theme.spaces[1]}px;
  border: 1px solid ${props => props.inputStyle.borderColor};
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[6]}px;
  background-color: ${props => props.inputStyle.bgColor};
  color: ${props => props.inputStyle.color};

  &::placeholder {
    color: ${props => props.theme.colors.blackShades[5]};
  }
  &:focus {
    border: 1px solid
      ${props =>
        props.isValid
          ? props.theme.colors.info.main
          : props.theme.colors.danger.main};
    box-shadow: ${props =>
      props.isValid
        ? "0px 0px 4px 4px rgba(203, 72, 16, 0.18)"
        : "0px 0px 4px 4px rgba(226, 44, 44, 0.18)"};
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

const TextInput = forwardRef(
  (props: TextInputProps, ref: Ref<HTMLInputElement>) => {
    const initialValidation = () => {
      let validationObj = { isValid: true, message: "" };
      if (props.defaultValue && props.validator) {
        validationObj = props.validator(props.defaultValue);
      }
      return validationObj;
    };

    const [validation, setValidation] = useState<{
      isValid: boolean;
      message: string;
    }>(initialValidation());

    const inputStyle = useMemo(() => boxStyles(props, validation.isValid), [
      props.disabled,
      validation,
    ]);

    const memoizedChangeHandler = useCallback(
      el => {
        props.validator && setValidation(props.validator(el.target.value));
        return props.onChange && props.onChange(el.target.value);
      },
      [props],
    );

    const ErrorMessage = <Text type={TextType.P3}>{validation.message}</Text>;

    return (
      <InputWrapper>
        <StyledInput
          type="text"
          ref={ref}
          inputStyle={inputStyle}
          isValid={validation.isValid}
          defaultValue={props.defaultValue}
          {...props}
          placeholder={props.placeholder ? props.placeholder : ""}
          onChange={memoizedChangeHandler}
        />
        {validation.isValid ? null : ErrorMessage}
      </InputWrapper>
    );
  },
);

TextInput.defaultProps = {
  fill: false,
};

TextInput.displayName = "TextInput";

export default TextInput;
