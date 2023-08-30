import React from "react";
import { Icon as BIcon } from "@blueprintjs/core";
import { TextInput } from "@design-system/widgets";
import { Icon, TextArea } from "@design-system/widgets";
import { INPUT_TYPES } from "widgets/BaseInputWidgetV2/constants";
import type { BaseInputComponentProps } from "widgets/BaseInputWidgetV2/component/types";

function InputComponent(props: BaseInputComponentProps) {
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

  return (
    <ElementType
      autoComplete={props.autoComplete}
      autoFocus={props.autoFocus}
      endIcon={endIcon}
      errorMessage={props.errorMessage}
      label={props.label}
      onChange={props.onValueChange}
      onFocusChange={props.onFocusChange}
      placeholder={props.placeholder}
      startIcon={startIcon}
      type={type}
      validationState={props.validationStatus}
    />
  );
}

export default InputComponent;
