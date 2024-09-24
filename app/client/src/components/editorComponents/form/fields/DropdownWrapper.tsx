import type { SelectOptionProps } from "@appsmith/ads";
import { Text, Option, Select } from "@appsmith/ads";
import React, { useEffect, useState } from "react";
import type { DropdownOnSelect } from "./SelectField";

interface DropdownWrapperProps {
  allowDeselection?: boolean;
  placeholder: string;
  input?: {
    value?: string;
    onChange?: (value?: string | Partial<SelectOptionProps>[]) => void;
  };
  options: Partial<SelectOptionProps>[];
  isMultiSelect?: boolean;
  onOptionSelect?: (
    value?: string,
    option?: Partial<SelectOptionProps>[] | Partial<SelectOptionProps>,
  ) => void;
  removeSelectedOption?: DropdownOnSelect;
  selected?: Partial<SelectOptionProps> | Partial<SelectOptionProps>[];
  showLabelOnly?: boolean;
  labelRenderer?: (selected: Partial<SelectOptionProps>[]) => JSX.Element;
  fillOptions?: boolean;
  disabled?: boolean;
  dropdownMaxHeight?: string;
  enableSearch?: boolean;
}

function DropdownWrapper(props: DropdownWrapperProps) {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOption, setSelectedOption] = useState<any>([
    {
      value: props.placeholder,
    },
  ]);

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSelectHandler = (value?: any, option?: any) => {
    if (props?.isMultiSelect) {
      const updatedItems: Partial<SelectOptionProps>[] = [
        ...selectedOption,
        option,
      ];

      props.input && props.input.onChange && props.input.onChange(updatedItems);
      props.onOptionSelect && props.onOptionSelect(value, updatedItems);
    } else {
      props.input && props.input.onChange && props.input.onChange(value);
      props.onOptionSelect && props.onOptionSelect(value, option);
    }
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onRemoveOptions = (value: any) => {
    const updatedItems = selectedOption.filter(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (option: any) => option.value !== value,
    );

    props.input && props.input.onChange && props.input.onChange(updatedItems);
    props.removeSelectedOption && props.removeSelectedOption(updatedItems);
  };

  useEffect(() => {
    if (props.selected) {
      setSelectedOption(props.selected);
    } else {
      if (props.input && props.input.value) {
        setSelectedOption([{ value: props.input.value }]);
      } else if (props.placeholder) {
        setSelectedOption([{ value: props.placeholder }]);
      }
    }
  }, [props.input, props.placeholder, props.selected]);

  return (
    <Select
      defaultValue={props.isMultiSelect ? selectedOption : selectedOption[0]}
      isDisabled={props.disabled}
      isMultiSelect={props.isMultiSelect}
      onDeselect={onRemoveOptions}
      onSelect={onSelectHandler}
      placeholder={props.placeholder}
      showSearch={props.enableSearch}
      value={props.isMultiSelect ? selectedOption : selectedOption[0]}
    >
      {props.options.map((option: Partial<SelectOptionProps>) => (
        <Option key={option.value} value={option.id}>
          <Text renderAs="p">{option.value}</Text>
          {option.label && <Text renderAs="p">{option.label}</Text>}
        </Option>
      ))}
    </Select>
  );
}

export default DropdownWrapper;
