import React, { useState, useMemo, useEffect } from "react";
import { TreeDropdown, TreeDropdownOption, TextInput } from "design-system";
import { debounce } from "lodash";
import { ActionBlock } from "../ActionBlock";
import { FIELD_CONFIG } from "../../Field/FieldConfig";
import { AppsmithFunction, FieldType } from "../../constants";
import { flattenOptions } from "../../utils";
import { getActionInfo, getIconForAction } from "../ActionBlockTree/utils";

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

type Props = {
  value: string;
  selectedOption: TreeDropdownOption;
  options: TreeDropdownOption[];
  onSelect: (
    option: TreeDropdownOption,
    defaultVal: any,
    isUpdatedViaKeyboard: boolean,
  ) => void;
};

export const SelectorDropdown: React.FC<Props> = ({
  onSelect,
  options,
  selectedOption,
  value,
}) => {
  const [isOpen, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const debouncedSetSearchText = useMemo(
    () => debounce(setDebouncedValue, 300),
    [],
  );

  const fieldConfig = FIELD_CONFIG[FieldType.ACTION_SELECTOR_FIELD];

  const actionType = (selectedOption.type || selectedOption.value) as any;

  const { action, actionTypeLabel, Icon } = getActionInfo(value, actionType);

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
      selectedValue={fieldConfig.getter(value)}
      toggle={
        isOpen ? (
          <TextInput
            autoFocus
            className="w-full"
            onChange={(val: string) => setSearchText(val)}
            value={searchText}
          />
        ) : (
          <ActionBlock
            action={action}
            actionTypeLabel={actionTypeLabel}
            icon={Icon}
            onClick={() => null}
          />
        )
      }
    />
  );
};
