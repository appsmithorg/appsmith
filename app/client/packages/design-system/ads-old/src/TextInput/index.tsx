import type { EventHandler, FocusEvent, Ref } from "react";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CommonComponentProps } from "../types/common";
import { Classes } from "../constants/classes";
import { typography } from "../constants/typography";
import { Classes as BlueprintClasses } from "@blueprintjs/core";
import styled from "styled-components";
import Text, { TextType } from "../Text";
import {
  ERROR_MESSAGE_NAME_EMPTY,
  createMessage,
  FORM_VALIDATION_INVALID_EMAIL,
} from "../constants/messages";
import type { IconName } from "../Icon";
import Icon, { IconCollection, IconSize } from "../Icon";
import { AsyncControllableInput } from "@blueprintjs/core/lib/esm/components/forms/asyncControllableInput";
import _ from "lodash";
import { replayHighlightClass } from "../constants/classes";
import { hexToRgba } from "../utils/colors";

export type InputType = "text" | "password" | "number" | "email" | "tel";

export type Validator = (value: string) => {
  isValid: boolean;
  message: string;
};

// TODO (abhinav): Use a regex which adheres to standards RFC5322
const isEmail = (value: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(value);
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
  leftIcon?: IconName;
  prefix?: string;
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
  isCopy?: boolean;
  border?: boolean;
  style?: any;
  tabIndex?: number;
};

interface boxReturnType {
  bgColor: string;
  color: string;
  borderColor: string;
}

const boxStyles = (props: TextInputProps, isValid: boolean): boxReturnType => {
  let bgColor = "var(--ads-text-input-text-box-default-background-color)";
  let color = "var(--ads-text-input-text-box-default-text-color)";
  let borderColor = "var(--ads-text-input-text-box-default-border-color)";

  if (props.disabled) {
    bgColor = "var(--ads-text-input-text-box-disabled-background-color)";
    color = "var(--ads-text-input-text-box-disabled-text-color)";
    borderColor = "var(--ads-text-input-text-box-disabled-border-color)";
  }
  if (props.readOnly) {
    bgColor = "var(--ads-text-input-text-box-read-only-background-color)";
    color = "var(--ads-text-input-text-box-read-only-text-color)";
    borderColor = "var(--ads-text-input-text-box-read-only-border-color)";
  }
  if (!isValid) {
    bgColor = hexToRgba("var(--ads-danger-main)", 0.1);
    color = "var(--ads-danger-main)";
    borderColor = "var(--ads-danger-main)";
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
`;

const StyledInput = styled((props) => {
  // we are removing non input related props before passing them in the components
  // eslint-disable @typescript-eslint/no-unused-vars
  const { dataType, inputRef, ...inputProps } = props;

  const omitProps = [
    "hasLeftIcon",
    "inputStyle",
    "rightSideComponentWidth",
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
    "border",
    "asyncControl",
    "handleCopy",
    "prefix",
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
  padding: 0px var(--ads-spaces-6);
  ${(props) => (props.$padding ? `padding: ${props.$padding}` : "")};
  padding-right: ${(props) =>
    `calc(${props.rightSideComponentWidth}px + var(--ads-spaces-6))`};
  background-color: transparent;
  font-size: ${typography.p1.fontSize}px;
  font-weight: ${typography.p1.fontWeight};
  line-height: ${typography.p1.lineHeight}px;
  letter-spacing: ${typography.p1.letterSpacing}px;
  text-overflow: ellipsis;
  height: 100%;

  &::placeholder {
    color: var(--ads-text-input-placeholder-text-color);
  }
  &:disabled {
    cursor: not-allowed;
  }
`;

export const InputWrapper = styled.div<{
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
  readOnly?: boolean;
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
    props.isFocused && !props.noBorder && !props.disabled && !props.readOnly
      ? `
      border: 1.2px solid
      ${
        props.isValid
          ? "var(--appsmith-input-focus-border-color)"
          : "var(--ads-danger-main)"
      };
      `
      : null}

  .${Classes.TEXT} {
    color: var(--ads-danger-main);
  }
  .helper {
    .${Classes.TEXT} {
      color: var(--ads-text-input-helper-text-text-color);
    }
  }
  &:hover {
    background-color: ${(props) =>
      props.disabled || props.readOnly
        ? props.inputStyle.bgColor
        : "var(--ads-text-input-text-box-hover-background-color)"};
  }
  ${(props) => (props.disabled ? "cursor: not-allowed;" : null)}
`;

const MsgWrapper = styled.div`
  position: absolute;
  bottom: -20px;
  left: 0px;
  &.helper {
    .${Classes.TEXT} {
      color: var(--ads-text-input-helper-text-text-color);
    }
  }
`;

const RightSideContainer = styled.div`
  position: absolute;
  right: var(--ads-spaces-6);
  bottom: 0;
  top: 0;
  display: flex;
  align-items: center;
`;

const IconWrapper = styled.div`
  .${Classes.ICON} {
    margin-right: var(--ads-spaces-5);
  }
`;

const PrefixWrapper = styled.div`
  .${Classes.TEXT} {
    padding-left: var(--ads-spaces-2);
    color: var(--ads-color-black-400);
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

    const { trimValue = false } = props;

    const setRightSideRef = useCallback((ref: HTMLDivElement) => {
      if (ref) {
        const { width } = ref.getBoundingClientRect();
        setRightSideComponentWidth(width);
      }
    }, []);

    const inputStyle = useMemo(
      () => boxStyles(props, validation?.isValid),
      [props, validation?.isValid],
    );

    // set the default value
    useEffect(() => {
      if (props.defaultValue) {
        const inputValue = props.defaultValue;
        setInputValue(inputValue);
        checkValidator(inputValue);
        props.onChange && props.onChange(inputValue);
      }
    }, [props.defaultValue]);

    const checkValidator = (inputValue: string) => {
      const inputValueValidation =
        props.validator && props.validator(inputValue);
      if (inputValueValidation) {
        props.validator && setValidation(inputValueValidation);
      }
    };

    const memoizedChangeHandler = useCallback(
      (el) => {
        const inputValue: string = trimValue
          ? el.target.value.trim()
          : el.target.value;
        setInputValue(inputValue);
        checkValidator(inputValue);
        return props.onChange && props.onChange(inputValue);
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
          {props.errorMsg ? props.errorMsg : validation?.message}
        </Text>
      </MsgWrapper>
    );

    const HelperMessage = (
      <MsgWrapper className="helper">
        <Text type={TextType.P3}>* {props.helperText}</Text>
      </MsgWrapper>
    );

    const iconColor = !validation?.isValid
      ? "var(--ads-danger-main)"
      : "var(--ads-text-input-icon-path-color)";

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
        isValid={validation?.isValid}
        noBorder={props.noBorder}
        readOnly={props.readOnly}
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

        {props.prefix && (
          <PrefixWrapper className="prefix">
            <Text type={TextType.P1}>{props.prefix}</Text>
          </PrefixWrapper>
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
          isValid={validation?.isValid}
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
          tabIndex={props.tabIndex ?? 0}
        />
        {validation?.isValid &&
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

export default TextInput;
