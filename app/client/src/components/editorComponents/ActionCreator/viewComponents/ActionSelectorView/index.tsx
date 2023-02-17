import React, { useState, useMemo, useEffect } from "react";
import { TreeDropdown, TreeDropdownOption, TextInput } from "design-system-old";
import { debounce } from "lodash";
import { FIELD_CONFIG } from "../../Field/FieldConfig";
import { FieldType } from "../../constants";
import {
  flattenOptions,
  getCodeFromMoustache,
  getSelectedFieldFromValue,
  isEmptyBlock,
} from "../../utils";
import { getActionInfo } from "../ActionBlockTree/utils";
import { SelectorViewProps } from "../../types";

function filterChildren(
  options: TreeDropdownOption[],
  searchText: string,
): TreeDropdownOption[] {
  return options.filter((option) => {
    if (option.children) {
      return filterChildren(option.children, searchText).length > 0;
    }
    return [option.label, option.value].some((val) =>
      val.toLowerCase().includes(searchText.toLowerCase()),
    );
  });
}

function sortOnChildrenLength(options: TreeDropdownOption[]) {
  return options.sort((a, b) => {
    return (a.children || []).length - (b.children || []).length;
  });
}

export const ActionSelectorView: React.FC<SelectorViewProps> = ({
  options,
  set,
  value,
}) => {
  const [isOpen, setOpen] = useState(isEmptyBlock(value));
  const [searchText, setSearchText] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const debouncedSetSearchText = useMemo(
    () => debounce(setDebouncedValue, 300),
    [],
  );

  const valueWithoutMoustache = getCodeFromMoustache(value);

  const selectedOption = getSelectedFieldFromValue(value, options);

  const fieldConfig = FIELD_CONFIG[FieldType.ACTION_SELECTOR_FIELD];

  const actionType = (selectedOption.type || selectedOption.value) as any;

  const { action } = getActionInfo(valueWithoutMoustache, actionType);

  useEffect(() => {
    debouncedSetSearchText(searchText);
  }, [searchText]);

  const filteredOptions = useMemo(() => {
    if (!debouncedValue) return options;
    const optionsToFilter =
      debouncedValue.length >= 3 ? flattenOptions(options) : options;
    return sortOnChildrenLength(
      filterChildren(optionsToFilter, debouncedValue),
    );
  }, [debouncedValue]);

  return (
    <TreeDropdown
      className="right-8"
      defaultOpen={isOpen}
      defaultText={action}
      menuHeight={300}
      menuWidth={256}
      onMenuToggle={(isOpen) => {
        setOpen(isOpen);
        setSearchText("");
      }}
      onSelect={set}
      optionTree={filteredOptions}
      popoverClassName="action-selector-dropdown"
      position="bottom"
      selectedValue={fieldConfig.getter(valueWithoutMoustache)}
      toggle={
        isOpen ? (
          <TextInput
            autoFocus
            className="w-full"
            onChange={(val: string) => setSearchText(val)}
            value={searchText}
          />
        ) : null
      }
      usePortal={false}
    />
  );
};
