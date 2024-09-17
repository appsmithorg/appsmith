import React from "react";
import { Text, TextInput } from "@appsmith/wds";
import type { CurrencyInputComponentProps } from "./types";
import { CurrencyTypeOptions } from "constants/Currency";
import { useDebouncedValue } from "@mantine/hooks";

const DEBOUNCE_TIME = 300;

export function CurrencyInputComponent(props: CurrencyInputComponentProps) {
  const currency = CurrencyTypeOptions.find(
    (option) => option.currency === props.currencyCode,
  );

  const prefix = (
    <Text style={{ whiteSpace: "nowrap" }}>{currency?.symbol_native}</Text>
  );

  // Note: because of how derived props are handled by MetaHoc, the isValid shows wrong
  // values for some milliseconds. To avoid that, we are using debounced value.
  const [validationStatus] = useDebouncedValue(
    props.validationStatus,
    DEBOUNCE_TIME,
  );
  const [errorMessage] = useDebouncedValue(props.errorMessage, DEBOUNCE_TIME);

  return (
    <TextInput
      autoComplete={props.autoComplete}
      autoFocus={props.autoFocus}
      contextualHelp={props.tooltip}
      errorMessage={props.validationStatus === "invalid" ? errorMessage : ""}
      excludeFromTabOrder={props.excludeFromTabOrder}
      isDisabled={props.isDisabled}
      isReadOnly={props.isReadOnly}
      isRequired={props.isRequired}
      label={props.label}
      onChange={props.onValueChange}
      onFocusChange={props.onFocusChange}
      onKeyDown={props.onKeyDown}
      placeholder={props.placeholder}
      prefix={prefix}
      validationState={validationStatus}
      value={props.value}
    />
  );
}
