import React, { type Key } from "react";
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Text,
  TextField,
} from "@appsmith/wds";
import { useDebouncedValue } from "@mantine/hooks";
import { CurrencyTypeOptions } from "constants/Currency";

import styles from "./styles.module.css";
import { countryToFlag } from "./utilities";
import type { CurrencyInputComponentProps } from "./types";

const DEBOUNCE_TIME = 300;

export function CurrencyInputComponent(props: CurrencyInputComponentProps) {
  const { allowCurrencyChange, onCurrencyChange } = props;
  const selectedCurrency = CurrencyTypeOptions.find(
    (option) => option.currency === props.currencyCode,
  );

  const onMenuItemSelect = (key: Key) => {
    const currency = CurrencyTypeOptions.find((option) => option.code === key);

    onCurrencyChange(currency?.currency);
  };

  const prefix = (function () {
    if (allowCurrencyChange) {
      return (
        <MenuTrigger>
          <Button
            color="neutral"
            icon="chevron-down"
            iconPosition="end"
            size="small"
            variant="subtle"
          >
            {selectedCurrency?.symbol_native}
          </Button>
          <Menu
            className={styles.currencyMenu}
            onAction={onMenuItemSelect}
            selectedKeys={
              selectedCurrency?.code ? new Set([selectedCurrency.code]) : []
            }
            selectionMode="single"
          >
            {CurrencyTypeOptions.map((item) => {
              return (
                <MenuItem
                  className={styles.currencyOption}
                  id={item.code}
                  key={`menu-item-${item.symbol_native}`}
                  textValue={item.currency}
                >
                  {countryToFlag(item.code)}{" "}
                  <span data-component="code">{item.currency}</span>{" "}
                  <span data-component="name">{item.currency_name}</span>
                </MenuItem>
              );
            })}
          </Menu>
        </MenuTrigger>
      );
    }

    return (
      <Text style={{ whiteSpace: "nowrap" }}>
        {selectedCurrency?.symbol_native}
      </Text>
    );
  })();

  // Note: because of how derived props are handled by MetaHoc, the isValid shows wrong
  // values for some milliseconds. To avoid that, we are using debounced value.
  const [validationStatus] = useDebouncedValue(
    props.validationStatus,
    DEBOUNCE_TIME,
  );
  const [errorMessage] = useDebouncedValue(props.errorMessage, DEBOUNCE_TIME);

  return (
    <TextField
      autoComplete={props.autoComplete}
      autoFocus={props.autoFocus}
      contextualHelp={props.tooltip}
      errorMessage={props.validationStatus === "invalid" ? errorMessage : ""}
      excludeFromTabOrder={props.excludeFromTabOrder}
      isDisabled={props.isDisabled}
      isInvalid={validationStatus === "invalid"}
      isReadOnly={props.isReadOnly}
      isRequired={props.isRequired}
      label={props.label}
      onChange={props.onValueChange}
      onFocusChange={props.onFocusChange}
      onKeyDown={props.onKeyDown}
      placeholder={props.placeholder}
      prefix={prefix}
      value={props.value}
    />
  );
}
