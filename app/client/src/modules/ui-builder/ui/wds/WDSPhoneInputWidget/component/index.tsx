import React, { type Key } from "react";
import { ISDCodeOptions } from "constants/ISDCodes_v2";
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Text,
  TextField,
} from "@appsmith/wds";

import styles from "./styles.module.css";
import { countryToFlag } from "../widget/helpers";
import type { PhoneInputComponentProps } from "./types";

export function PhoneInputComponent(props: PhoneInputComponentProps) {
  const { allowDialCodeChange, onISDCodeChange } = props;

  const selectedCountry = ISDCodeOptions.find(
    (option) => option.dial_code === props.dialCode,
  );

  const onMenuItemSelect = (key: Key) => {
    const country = ISDCodeOptions.find((option) => option.code === key);

    onISDCodeChange(country?.dial_code);
  };

  const prefix = (function () {
    if (allowDialCodeChange) {
      return (
        <MenuTrigger>
          <Button
            color="neutral"
            icon="chevron-down"
            iconPosition="end"
            size="small"
            variant="subtle"
          >
            {selectedCountry?.dial_code ?? ""}
          </Button>
          <Menu
            className={styles.currencyMenu}
            onAction={onMenuItemSelect}
            selectedKeys={
              selectedCountry?.dial_code
                ? new Set([selectedCountry.dial_code])
                : []
            }
            selectionMode="single"
          >
            {ISDCodeOptions.map((item) => {
              return (
                <MenuItem
                  className={styles.dialCodeOption}
                  id={item.code}
                  key={`menu-item-${item.code}`}
                  textValue={item.name}
                >
                  {countryToFlag(item?.dial_code ?? "")}{" "}
                  <span data-component="code">{item.dial_code}</span>{" "}
                  <span data-component="name">{item.name}</span>
                </MenuItem>
              );
            })}
          </Menu>
        </MenuTrigger>
      );
    }

    return (
      <Text style={{ whiteSpace: "nowrap" }}>{selectedCountry?.dial_code}</Text>
    );
  })();

  return (
    <TextField
      autoComplete={props.autoComplete}
      autoFocus={props.autoFocus}
      contextualHelp={props.tooltip}
      errorMessage={props.errorMessage}
      excludeFromTabOrder={props.excludeFromTabOrder}
      isDisabled={props.isDisabled}
      isInvalid={props.validationStatus === "invalid"}
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
