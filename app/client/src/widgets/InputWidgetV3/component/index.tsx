import React from "react";
import { isNil } from "lodash";
import { Icon as BIcon } from "@blueprintjs/core";
import { TextInput } from "@design-system/widgets";
import { Icon, TextArea } from "@design-system/widgets";

import { INPUT_TYPES } from "../constants";
import type { InputComponentProps } from "./types";

function InputComponent(props: InputComponentProps) {
  const startIcon = (() => {
    if (props.iconName && props.iconAlign === "left") {
      return (
        <Icon>
          <BIcon icon={props.iconName} />
        </Icon>
      );
    }
  })();

  const endIcon = (() => {
    if (props.inputType === "PASSWORD") return undefined;

    if (props.iconName && props.iconAlign === "right") {
      return (
        <Icon>
          <BIcon icon={props.iconName} />
        </Icon>
      );
    }
  })();

  const type = (() => {
    if (props.inputType === INPUT_TYPES.MULTI_LINE_TEXT) return undefined;

    switch (props.inputType) {
      case INPUT_TYPES.PASSWORD:
        return "password";
      case INPUT_TYPES.EMAIL:
        return "email";
      case INPUT_TYPES.NUMBER:
        return "number";
      default:
        return "text";
    }
  })();

  const ElementType: React.ElementType =
    props.inputType === INPUT_TYPES.MULTI_LINE_TEXT ? TextArea : TextInput;

  const autoComplete = (() => {
    if (
      !props.autoComplete &&
      (props.inputType === INPUT_TYPES.PASSWORD ||
        props.inputType === INPUT_TYPES.EMAIL)
    )
      return "off";

    return props.autoComplete;
  })();

  // minLength prop is needed only in case of text and textare input type
  const maxLength = (() => {
    if (
      props.inputType === INPUT_TYPES.TEXT ||
      props.inputType === INPUT_TYPES.EMAIL
    ) {
      return !isNil(props.maxChars) ? props.maxChars : undefined;
    }
  })();

  // min prop is needed only in case of number input type
  const min = (() => {
    if (props.inputType === INPUT_TYPES.NUMBER) {
      return !isNil(props.minNum) ? props.minNum : undefined;
    }
  })();

  // max prop is needed only in case of number input type
  const max = (() => {
    if (props.inputType === INPUT_TYPES.NUMBER) {
      return !isNil(props.maxNum) ? props.maxNum : undefined;
    }
  })();

  return (
    <ElementType
      autoComplete={autoComplete}
      autoFocus={props.autoFocus}
      defaultValue={props.defaultValue}
      endIcon={endIcon}
      errorMessage={props.errorMessage}
      label={props.label}
      max={max}
      maxLength={maxLength}
      min={min}
      onChange={props.onValueChange}
      onFocusChange={props.onFocusChange}
      onKeyDown={props.onKeyDown}
      placeholder={props.placeholder}
      spellCheck={props.spellCheck}
      startIcon={startIcon}
      type={type}
      validationState={props.validationStatus}
    />
  );
}

export default InputComponent;
