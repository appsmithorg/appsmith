import React, { forwardRef, Ref, useCallback, useMemo, useState } from "react";
import { CommonComponentProps, hexToRgba, Classes } from "./common";
import styled from "styled-components";
import Text, { TextType } from "./Text";
import {
  FORM_VALIDATION_INVALID_EMAIL,
  ERROR_MESSAGE_NAME_EMPTY,
} from "constants/messages";
import { isEmail } from "utils/formhelpers";
import { useSelector } from "react-redux";
import { getThemeDetails } from "selectors/themeSelectors";

export type Validator = (
  value: string,
) => {
  isValid: boolean;
  message: string;
};

export function emailValidator(email: string) {
  const isValid = isEmail(email);
  return {
    isValid: isValid,
    message: !isValid ? FORM_VALIDATION_INVALID_EMAIL : "",
  };
}

export function notEmptyValidator(value: string) {
  const isValid = !!value;
  return {
    isValid: isValid,
    message: !isValid ? ERROR_MESSAGE_NAME_EMPTY : "",
  };
}

export type TextInputProps = CommonComponentProps & {
  placeholder?: string;
  fill?: boolean;
  defaultValue?: string;
  validator?: (value: string) => { isValid: boolean; message: string };
  onChange?: (value: string) => void;
  readOnly?: boolean;
};

type boxReturnType = {
  bgColor: string;
  color: string;
  borderColor: string;
};

const boxStyles = (
  props: TextInputProps,
  isValid: boolean,
  theme: any,
): boxReturnType => {
  let bgColor = theme.colors.textInput.normal.bg;
  let color = theme.colors.textInput.normal.text;
  let borderColor = theme.colors.textInput.normal.border;

  if (props.disabled || props.readOnly) {
    bgColor = theme.colors.textInput.disable.bg;
    color = theme.colors.textInput.disable.text;
    borderColor = theme.colors.textInput.disable.border;
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
  border: 1px solid ${props => props.inputStyle.borderColor};
  padding: 0px ${props => props.theme.spaces[6]}px;
  height: 38px;
  background-color: ${props => props.inputStyle.bgColor};
  color: ${props => props.inputStyle.color};

  &::placeholder {
    color: ${props => props.theme.colors.textInput.placeholder};
  }
  &:disabled {
    cursor: not-allowed;
  }
  ${props =>
    !props.readOnly
      ? `
  &:focus {
    border: 1px solid
      ${
        props.isValid
          ? props.theme.colors.info.main
          : props.theme.colors.danger.main
      };
    box-shadow: ${
      props.isValid
        ? "0px 0px 4px 4px rgba(203, 72, 16, 0.18)"
        : "0px 0px 4px 4px rgba(226, 44, 44, 0.18)"
    };
  }
  `
      : null};
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;

  .${Classes.TEXT} {
    color: ${props => props.theme.colors.danger.main};
  }
`;

const ErrorWrapper = styled.div`
  position: absolute;
  bottom: -17px;
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

    const theme = useSelector(getThemeDetails).theme;

    const inputStyle = useMemo(
      () => boxStyles(props, validation.isValid, theme),
      [props, validation.isValid, theme],
    );

    const memoizedChangeHandler = useCallback(
      el => {
        const validation = props.validator && props.validator(el.target.value);
        if (validation) {
          props.validator && setValidation(validation);
          return (
            validation.isValid &&
            props.onChange &&
            props.onChange(el.target.value)
          );
        } else {
          return props.onChange && props.onChange(el.target.value);
        }
      },
      [props],
    );

    const ErrorMessage = (
      <ErrorWrapper>
        <Text type={TextType.P3}>{validation.message}</Text>
      </ErrorWrapper>
    );

    return (
      <InputWrapper data-cy={props.cypressSelector}>
        <StyledInput
          type="text"
          ref={ref}
          inputStyle={inputStyle}
          isValid={validation.isValid}
          defaultValue={props.defaultValue}
          {...props}
          placeholder={props.placeholder}
          onChange={memoizedChangeHandler}
          readOnly={props.readOnly}
        />
        {ErrorMessage}
      </InputWrapper>
    );
  },
);

TextInput.displayName = "TextInput";

export default TextInput;
