import React from "react";
import { ISDCodeOptions } from "constants/ISDCodes_v2";
import { Text, TextInput } from "@design-system/widgets";

import type { PhoneInputComponentProps } from "./types";

export function PhoneInputComponent(props: PhoneInputComponentProps) {
  const selectedCountry = ISDCodeOptions.find(
    (option) => option.dial_code === props.dialCode,
  );

  const prefix = (
    <Text
      style={{ whiteSpace: "nowrap" }}
    >{`${selectedCountry?.dial_code}`}</Text>
  );

  return (
    <TextInput
      autoComplete={props.autoComplete}
      autoFocus={props.autoFocus}
      contextualHelp={props.tooltip}
      errorMessage={props.errorMessage}
      isDisabled={props.isDisabled}
      isReadOnly={props.isReadOnly}
      isRequired={props.isRequired}
      label={props.label}
      onChange={props.onValueChange}
      onFocusChange={props.onFocusChange}
      onKeyDown={props.onKeyDown}
      placeholder={props.placeholder}
      prefix={prefix}
      validationState={props.validationStatus}
      value={props.value}
    />
  );
}
