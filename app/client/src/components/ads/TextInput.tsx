import React, {
  EventHandler,
  FocusEvent,
  forwardRef,
  Ref,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Classes, CommonComponentProps, hexToRgba } from "./common";
import { Classes as BlueprintClasses } from "@blueprintjs/core";
import styled, { withTheme } from "styled-components";
import Text, { TextType } from "./Text";
import {
  ERROR_MESSAGE_NAME_EMPTY,
  createMessage,
  FORM_VALIDATION_INVALID_EMAIL,
} from "@appsmith/constants/messages";
import { isEmail } from "utils/formhelpers";
import Icon, { IconCollection, IconName, IconSize } from "./Icon";
import { AsyncControllableInput } from "@blueprintjs/core/lib/esm/components/forms/asyncControllableInput";
import _ from "lodash";
import { replayHighlightClass } from "globalStyles/portals";

export type InputType = "text" | "password" | "number" | "email" | "tel";

export type Validator = (
  value: string,
) => {
  isValid: boolean;
  message: string;
};

export function emailValidator(email: string) {
  let isValid = true;
  if (email) {
    isValid = isEmail(email);
  }
  return {
    isValid: isValid,
    message: !isValid ? createMessage(FORM_VALIDATION_INVALID_EMAIL) : "",
  };
}

export function notEmptyValidator(value: string) {
  const isValid = !!value;
  return {
    isValid: isValid,
    message: !isValid ? createMessage(ERROR_MESSAGE_NAME_EMPTY) : "",
  };
}

export type TextInputProps = CommonComponentProps & {
  autoFocus?: boolean;
  placeholder?: string;
  fill?: boolean;
  defaultValue?: string;
  value?: string;
  validator?: (value: string) => { isValid: boolean; message: string };
  onChange?: (value: string) => void;
  readOnly?: boolean;
  dataType?: string;
  theme?: any;
  leftIcon?: IconName;
  helperText?: string;
  rightSideComponent?: React.ReactNode;
  width?: string;
  height?: string;
  noBorder?: boolean;
  noCaret?: boolean;
  onBlur?: EventHandler<FocusEvent<any>>;
  onFocus?: EventHandler<FocusEvent<any>>;
  errorMsg?: string;
  trimValue?: boolean;
  $padding?: string;
  useTextArea?: boolean;
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

  if (props.disabled) {
    bgColor = theme.colors.textInput.disable.bg;
    color = theme.colors.textInput.disable.text;
    borderColor = theme.colors.textInput.disable.border;
  }
  if (props.readOnly) {
    bgColor = theme.colors.textInput.readOnly.bg;
    color = theme.colors.textInput.readOnly.text;
    borderColor = theme.colors.textInput.readOnly.border;
  }
  if (!isValid) {
    bgColor = hexToRgba(theme.colors.danger.main, 0.1);
    color = theme.colors.danger.main;
    borderColor = theme.colors.danger.main;
  }
  return { bgColor, color, borderColor };
};

const InputLoader = styled.div<{
  $value?: string;
  $noBorder?: boolean;
  $isFocused?: boolean;
  $isLoading?: boolean;
  $height?: string;
}>`
  display: ${(props) => (props.$isLoading ? "static" : "none")};
  border-radius: 0;
  width: ${(props) =>
    props.$value && !props.$noBorder && props.$isFocused
      ? "calc(100% - 50px)"
      : "100%"};

  height: ${(props) => props.$height || "36px"};
  border-radius: 0;
`;

const StyledInput = styled((props) => {
  // we are removing non input related props before passing them in the components
  // eslint-disable @typescript-eslint/no-unused-vars
  const { dataType, inputRef, ...inputProps } = props;

  const omitProps = [
    "hasLeftIcon",
    "inputStyle",
    "rightSideComponentWidth",
    "theme",
    "validator",
    "isValid",
    "cypressSelector",
    "leftIcon",
    "helperText",
    "rightSideComponent",
    "noBorder",
    "isLoading",
    "noCaret",
    "fill",
    "errorMsg",
    "useTextArea",
  ];

  const HtmlTag = props.useTextArea ? "textarea" : "input";

  return props.asyncControl ? (
    <AsyncControllableInput
      {..._.omit(inputProps, omitProps)}
      datatype={dataType}
      inputRef={inputRef}
    />
  ) : (
    <HtmlTag ref={inputRef} {..._.omit(inputProps, omitProps)} />
  );
})<
  TextInputProps & {
    inputStyle: boxReturnType;
    isValid: boolean;
    rightSideComponentWidth: number;
    hasLeftIcon: boolean;
    $isLoading?: boolean;
  }
>`
  display: ${(props) => (props.$isLoading ? "none" : "static")};
  ${(props) => (props.noCaret ? "caret-color: white;" : null)};
  color: ${(props) => props.inputStyle.color};
  width: ${(props) =>
    props.value && !props.noBorder && props.isFocused
      ? "calc(100% - 50px)"
      : "100%"};
  border-radius: 0;
  outline: 0;
  box-shadow: none;
  border: none;
  padding: 0px ${(props) => props.theme.spaces[6]}px;
  ${(props) => (props.$padding ? `padding: ${props.$padding}` : "")};
  padding-right: ${(props) =>
    props.rightSideComponentWidth + props.theme.spaces[6]}px;
  background-color: transparent;
  font-size: ${(props) => props.theme.typography.p1.fontSize}px;
  font-weight: ${(props) => props.theme.typography.p1.fontWeight};
  line-height: ${(props) => props.theme.typography.p1.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.p1.letterSpacing}px;
  text-overflow: ellipsis;
  height: 100%;

  &::placeholder {
    color: ${(props) => props.theme.colors.textInput.placeholder};
  }
  &:disabled {
    cursor: not-allowed;
  }
`;

const InputWrapper = styled.div<{
  value?: string;
  isFocused: boolean;
  fill?: number;
  noBorder?: boolean;
  height?: string;
  width?: string;
  inputStyle: boxReturnType;
  isValid?: boolean;
  disabled?: boolean;
  $isLoading?: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;  
  width: ${(props) =>
    props.fill ? "100%" : props.width ? props.width : "260px"};
  height: ${(props) => props.height || "36px"};
  border: 1.2px solid
    ${(props) =>
      props.noBorder ? "transparent" : props.inputStyle.borderColor};
  background-color: ${(props) => props.inputStyle.bgColor};
  color: ${(props) => props.inputStyle.color};
  ${(props) =>
    props.isFocused && !props.noBorder
      ? `
      border: 1.2px solid
      ${
        props.isValid
          ? "var(--appsmith-input-focus-border-color)"
          : props.theme.colors.danger.main
      };
      `
      : null}

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.danger.main};
  }
  ​ .helper {
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.textInput.helper};
    }
  }
  &:hover {
    background-color: ${(props) =>
      props.disabled
        ? props.inputStyle.bgColor
        : props.theme.colors.textInput.hover.bg};
  }
  ${(props) => (props.disabled ? "cursor: not-allowed;" : null)}
`;

const MsgWrapper = styled.div`
  position: absolute;
  bottom: -20px;
  left: 0px;
  &.helper {
    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.textInput.helper};
    }
  }
`;

const RightSideContainer = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[6]}px;
  bottom: 0;
  top: 0;
  display: flex;
  align-items: center;
`;

const IconWrapper = styled.div`
  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[5]}px;
  }
`;

const initialValidation = (props: TextInputProps) => {
  let validationObj = { isValid: true, message: "" };
  if (props.defaultValue && props.validator) {
    validationObj = props.validator(props.defaultValue);
  }
  return validationObj;
};

const TextInput = forwardRef(
  (props: TextInputProps, ref: Ref<HTMLInputElement>) => {
    //
    const [validation, setValidation] = useState<{
      isValid: boolean;
      message: string;
    }>(initialValidation(props));

    const [rightSideComponentWidth, setRightSideComponentWidth] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState(props.defaultValue);

    const { trimValue = true } = props;

    const setRightSideRef = useCallback((ref: HTMLDivElement) => {
      if (ref) {
        const { width } = ref.getBoundingClientRect();
        setRightSideComponentWidth(width);
      }
    }, []);

    const inputStyle = useMemo(
      () => boxStyles(props, validation.isValid, props.theme),
      [props, validation.isValid, props.theme],
    );

    const memoizedChangeHandler = useCallback(
      (el) => {
        const inputValue: string = trimValue
          ? el.target.value.trim()
          : el.target.value;
        setInputValue(inputValue);
        const inputValueValidation =
          props.validator && props.validator(inputValue);
        if (inputValueValidation && inputValueValidation.isValid) {
          props.validator && setValidation(inputValueValidation);
          return (
            inputValueValidation.isValid &&
            props.onChange &&
            props.onChange(inputValue)
          );
        } else {
          return props.onChange && props.onChange(inputValue);
        }
      },
      [props.onChange, setValidation, trimValue],
    );

    const onBlurHandler = useCallback(
      (e: React.FocusEvent<any>) => {
        setIsFocused(false);
        if (props.onBlur) props.onBlur(e);
      },
      [setIsFocused, props.onBlur],
    );

    const onFocusHandler = useCallback((e: React.FocusEvent<any>) => {
      setIsFocused(true);
      if (props.onFocus) props.onFocus(e);
    }, []);

    const ErrorMessage = (
      <MsgWrapper>
        <Text type={TextType.P3}>
          {props.errorMsg ? props.errorMsg : validation.message}
        </Text>
      </MsgWrapper>
    );

    const HelperMessage = (
      <MsgWrapper className="helper">
        <Text type={TextType.P3}>* {props.helperText}</Text>
      </MsgWrapper>
    );

    const iconColor = !validation.isValid
      ? props.theme.colors.danger.main
      : props.theme.colors.textInput.icon;

    const hasLeftIcon = props.leftIcon
      ? IconCollection.includes(props.leftIcon)
      : false;

    return (
      <InputWrapper
        $isLoading={props.isLoading}
        className={replayHighlightClass}
        disabled={props.disabled}
        fill={props.fill ? 1 : 0}
        height={props.height || undefined}
        inputStyle={inputStyle}
        isFocused={isFocused}
        isValid={validation.isValid}
        noBorder={props.noBorder}
        value={inputValue}
        width={props.width || undefined}
      >
        {props.leftIcon && (
          <IconWrapper className="left-icon">
            <Icon
              fillColor={iconColor}
              name={props.leftIcon}
              size={IconSize.MEDIUM}
            />
          </IconWrapper>
        )}

        <InputLoader
          $height={props.height}
          $isFocused={isFocused}
          $isLoading={props.isLoading}
          $noBorder={props.noBorder}
          $value={props.value}
          className={BlueprintClasses.SKELETON}
        />

        <StyledInput
          $isLoading={props.isLoading}
          autoFocus={props.autoFocus}
          defaultValue={props.defaultValue}
          inputStyle={inputStyle}
          isValid={validation.isValid}
          ref={ref}
          type={props.dataType || "text"}
          {...props}
          data-cy={props.cypressSelector}
          hasLeftIcon={hasLeftIcon}
          inputRef={ref}
          name={props?.name}
          onBlur={onBlurHandler}
          onChange={memoizedChangeHandler}
          onFocus={onFocusHandler}
          placeholder={props.placeholder}
          readOnly={props.readOnly}
          rightSideComponentWidth={rightSideComponentWidth}
        />
        {validation.isValid &&
          props.helperText &&
          props.helperText.length > 0 &&
          HelperMessage}
        {ErrorMessage}
        <RightSideContainer className="right-icon" ref={setRightSideRef}>
          {props.rightSideComponent}
        </RightSideContainer>
      </InputWrapper>
    );
  },
);

TextInput.displayName = "TextInput";

export default withTheme(TextInput);
