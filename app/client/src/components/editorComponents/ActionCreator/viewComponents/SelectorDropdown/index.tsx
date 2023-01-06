import React, { useState, useMemo } from "react";
import { TreeDropdown, TreeDropdownOption, TextInput } from "design-system";
import { ActionBlock } from "../ActionBlock";

type Props = {
  options: TreeDropdownOption[];
  selectedOption: TreeDropdownOption;
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
}) => {
  const [isOpen, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

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
          <ActionBlock label={selectedOption} />
        )
      }
    />
  );
};
