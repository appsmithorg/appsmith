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
<<<<<<< HEAD
      label={props.label}
      onChange={props.onValueChange}
      onFocusChange={props.onFocusChange}
=======
      isRequired={props.isRequired}
      label={props.label}
      onChange={props.onValueChange}
      onFocusChange={props.onFocusChange}
      onKeyDown={props.onKeyDown}
>>>>>>> ff87f5acb928d293937d20b7c1a4d02d20e78426
      placeholder={props.placeholder}
      startIcon={<Text>{currency?.symbol_native}</Text>}
      validationState={props.validationStatus}
      value={props.value}
    />
  );
}
