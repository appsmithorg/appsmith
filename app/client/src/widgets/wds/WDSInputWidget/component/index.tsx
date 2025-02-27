import React from "react";
import { isNil } from "lodash";
import { TextField } from "@appsmith/wds";
import { Icon, TextArea } from "@appsmith/wds";
import { useDebouncedValue } from "@mantine/hooks";
import { INPUT_TYPES } from "widgets/wds/WDSBaseInputWidget";

import type { InputComponentProps } from "./types";

const DEBOUNCE_TIME = 300;

function InputComponent(props: InputComponentProps) {
  // Note: because of how derived props are handled by MetaHoc, the isValid shows wrong
  // values for some milliseconds. To avoid that, we are using debounced value.
  const [validationStatus] = useDebouncedValue(
    props.validationStatus,
    DEBOUNCE_TIME,
  );
  const [errorMessage] = useDebouncedValue(props.errorMessage, DEBOUNCE_TIME);

  const startIcon = (() => {
    if (props.iconName && props.iconAlign === "left") {
      return <Icon name={props.iconName} />;
    }
  })();

  const endIcon = (() => {
    if (props.inputType === "PASSWORD") return undefined;

    if (props.iconName && props.iconAlign === "right") {
      return <Icon name={props.iconName} />;
    }
  })();

  const type = (() => {
    if (props.inputType === INPUT_TYPES.MULTI_LINE_TEXT) return undefined;

    switch (props.inputType) {
      case INPUT_TYPES.PASSWORD:
        return "password";
      case INPUT_TYPES.EMAIL:
        return "email";
      default:
        return "text";
    }
  })();

  const ElementType: React.ElementType =
    props.inputType === INPUT_TYPES.MULTI_LINE_TEXT ? TextArea : TextField;

  const autoComplete = (() => {
    if (
      !props.autoComplete &&
      (props.inputType === INPUT_TYPES.PASSWORD ||
        props.inputType === INPUT_TYPES.EMAIL)
    ) {
      return "off";
    }

    return props.autoComplete;
  })();

  // minLength prop is needed only in case of text and textare input type
  const maxLength = (() => {
    if (
      props.inputType === INPUT_TYPES.TEXT ||
      props.inputType === INPUT_TYPES.MULTI_LINE_TEXT
    ) {
      // Note: this check is required to bypass when maxChars is 0
      // TODO: check with fe-coders why empty maxChars is getting converted to 0
      if (props.maxChars) {
        return !isNil(props.maxChars) ? props.maxChars : undefined;
      }
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
      contextualHelp={props.tooltip}
      defaultValue={props.defaultValue}
      errorMessage={validationStatus === "invalid" ? errorMessage : ""}
      excludeFromTabOrder={props.excludeFromTabOrder}
      isDisabled={props.isDisabled}
      isInvalid={props.validationStatus === "invalid"}
      isReadOnly={props.isReadOnly}
      isRequired={props.isRequired}
      label={props.label}
      max={max}
      maxLength={maxLength}
      min={min}
      onChange={props.onValueChange}
      onFocusChange={props.onFocusChange}
      onKeyDown={props.onKeyDown}
      onPaste={props.onPaste}
      placeholder={props.placeholder}
      prefix={startIcon}
      spellCheck={props.spellCheck}
      suffix={endIcon}
      type={type}
      value={props.value}
    />
  );
}

export default InputComponent;
