import React, { memo, useContext } from "react";
import {
  ErrorMessage,
  Label,
  LabelWrapper,
  PrimaryKeysMessage,
  SelectWrapper,
} from "../../styles";
import { useTableOrSpreadsheet } from "./useTableOrSpreadsheet";
import { Select, Option, Tooltip } from "@appsmith/ads";
import { DropdownOption } from "../DatasourceDropdown/DropdownOption";
import type { DefaultOptionType } from "rc-select/lib/Select";
import { ColumnSelectorModal } from "../ColumnSelectorModal";
import { WidgetQueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm/index";
import { createMessage } from "ee/constants/messages";
import { NO_PRIMARY_KEYS_MESSAGE, PRIMARY_KEYS_MESSAGE } from "../../constants";

function TableOrSpreadsheetDropdown() {
  const {
    disabled,
    error,
    isLoading,
    label,
    labelText,
    onSelect,
    options,
    selected,
    show,
  } = useTableOrSpreadsheet();

  const { showEditFieldsModal } = useContext(WidgetQueryGeneratorFormContext);

  if (show) {
    return (
      <SelectWrapper className="space-y-2">
        <LabelWrapper>
          <Tooltip content={labelText}>
            <Label>{label}</Label>
          </Tooltip>
          {showEditFieldsModal && (
            <ColumnSelectorModal isDisabled={!selected} />
          )}
        </LabelWrapper>
        <Select
          data-testid="t--one-click-binding-table-selector"
          isDisabled={disabled}
          isLoading={isLoading}
          isValid={!error}
          onSelect={(value: string, selectedOption: DefaultOptionType) => {
            const option = options.find(
              (d: DefaultOptionType) => d.id === selectedOption.key,
            );

            if (option) {
              onSelect(value, option);
            }
          }}
          showSearch
          value={selected}
          virtual={false}
        >
          {options.map((option) => {
            return (
              <Option
                data-testid="t--one-click-binding-table-selector--table"
                disabled={option.disabled}
                key={option.id}
                value={option.value}
              >
                <DropdownOption
                  label={option.label}
                  subText={
                    option.disabled
                      ? createMessage(NO_PRIMARY_KEYS_MESSAGE)
                      : undefined
                  }
                />
              </Option>
            );
          })}
        </Select>
        <ErrorMessage data-testid="t--one-click-binding-table-selector--error">
          {error}
        </ErrorMessage>

        <PrimaryKeysMessage>
          {createMessage(PRIMARY_KEYS_MESSAGE)}
        </PrimaryKeysMessage>
      </SelectWrapper>
    );
  } else {
    return null;
  }
}

export default memo(TableOrSpreadsheetDropdown);
