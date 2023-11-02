import React from "react";
import { Text, TextInput } from "@design-system/widgets";
import type { CurrencyInputComponentProps } from "./types";
import { CurrencyTypeOptions } from "constants/Currency";

export function CurrencyInputComponent(props: CurrencyInputComponentProps) {
  const currency = CurrencyTypeOptions.find(
    (option) => option.currency === props.currencyCode,
  );

  return (
    <TextInput
      autoComplete={props.autoComplete}
      autoFocus={props.autoFocus}
      contextualHelp={props.tooltip}
      errorMessage={props.errorMessage}
      isDisabled={props.isDisabled}
      label={props.label}
      onChange={props.onValueChange}
      onFocusChange={props.onFocusChange}
      placeholder={props.placeholder}
      startIcon={<Text>{currency?.symbol_native}</Text>}
      validationState={props.validationStatus}
      value={props.value}
    />
  );
}
