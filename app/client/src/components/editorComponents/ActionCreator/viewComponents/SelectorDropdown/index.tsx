import React, { useState, useMemo, useEffect } from "react";
import { TreeDropdown, TreeDropdownOption, TextInput } from "design-system";
import { debounce } from "lodash";
import { ActionBlock } from "../ActionBlock";
import { SelectorField } from "../../types";
import { FIELD_CONFIG } from "../../Field/FieldConfig";
import { AppsmithFunction } from "../../constants";
import { FIELD_GROUP_CONFIG } from "../../FieldGroup/FieldGroupConfig";

function flattenOptions(
  options: TreeDropdownOption[],
  results: TreeDropdownOption[] = [],
): TreeDropdownOption[] {
  options.forEach((option) => {
    results.push(option);
    if (option.children) {
      flattenOptions(option.children, results);
    }
  });
  return results;
}

function filterChildren(
  options: TreeDropdownOption[],
  searchText: string,
): TreeDropdownOption[] {
  return options.filter((option) => {
    if (option.children) {
      return filterChildren(option.children, searchText).length > 0;
    }
    return option.label.toLowerCase().includes(searchText.toLowerCase());
  });
}

function sortOnChildrenLength(options: TreeDropdownOption[]) {
  return options.sort((a, b) => {
    return (a.children || []).length - (b.children || []).length;
  });
}

type Props = {
  options: TreeDropdownOption[];
  selectedField: SelectorField | undefined;
  onSelect: (
    option: TreeDropdownOption,
    defaultVal: any,
    isUpdatedViaKeyboard: boolean,
  ) => void;
};

export const SelectorDropdown: React.FC<Props> = ({
  onSelect,
  options,
  selectedField,
}) => {
  const [isOpen, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const debouncedSetSearchText = useMemo(
    () => debounce(setDebouncedValue, 300),
    [],
  );

  console.log({ options });

  const fieldConfig = selectedField ? FIELD_CONFIG[selectedField.field] : null;
  const actionType = fieldConfig
    ? fieldConfig.actionType
    : AppsmithFunction.none;
  const fieldTypeLabel = FIELD_GROUP_CONFIG[actionType].label;

  console.log("selectedField", selectedField);
  console.log("fieldConfig", fieldConfig);

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
      defaultText="Some default text here"
      menuWidth={260}
      onMenuToggle={(isOpen) => {
        setOpen(isOpen);
      }}
      onSelect={onSelect}
      optionTree={filteredOptions}
      position="left"
      selectedValue="PRIMARY"
      toggle={
        isOpen ? (
          <TextInput
            autoFocus
            className="w-full"
            onChange={(val: string) => setSearchText(val)}
            value={searchText}
          />
        ) : (
          <ActionBlock label={fieldTypeLabel} />
        )
      }
    />
  );
};
