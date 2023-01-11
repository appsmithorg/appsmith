import React, { useState, useMemo } from "react";
import { TreeDropdown, TreeDropdownOption, TextInput } from "design-system";
import { ActionBlock } from "../ActionBlock";
import { SelectorField } from "../../types";
import { FIELD_CONFIG } from "../../Field/FieldConfig";
import { AppsmithFunction } from "../../constants";
import { FIELD_GROUP_CONFIG } from "../../FieldGroup/FieldGroupConfig";

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

  console.log({ options });

  const fieldConfig = selectedField ? FIELD_CONFIG[selectedField.field] : null;
  const actionType = fieldConfig
    ? fieldConfig.actionType
    : AppsmithFunction.none;
  const fieldTypeLabel = FIELD_GROUP_CONFIG[actionType].label;

  console.log("selectedField", selectedField);
  console.log("fieldConfig", fieldConfig);

  const filteredOptions = useMemo(() => {
    if (!searchText) return options;
    return options
      .filter(({ label }) =>
        label.toLowerCase().includes(searchText.toLowerCase()),
      )
      .map((option) => {
        const filteredChildren = option.children?.filter((child) =>
          child.label.toLowerCase().includes(searchText.toLowerCase()),
        );
        return {
          ...option,
          children: filteredChildren,
        };
      });
  }, [searchText]);

  return (
    <TreeDropdown
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
