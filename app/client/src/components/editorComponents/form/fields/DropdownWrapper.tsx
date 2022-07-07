import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import React, { useEffect, useState } from "react";
import { DropdownOnSelect } from "./SelectField";

type DropdownWrapperProps = {
  allowDeselection?: boolean;
  placeholder: string;
  input?: {
    value?: string;
    onChange?: (value?: string | DropdownOption[]) => void;
  };
  options: DropdownOption[];
  isMultiSelect?: boolean;
  onOptionSelect?: (value?: string, option?: DropdownOption[]) => void;
  removeSelectedOption?: DropdownOnSelect;
  selected?: DropdownOption | DropdownOption[];
  showLabelOnly?: boolean;
  labelRenderer?: (selected: Partial<DropdownOption>[]) => JSX.Element;
  fillOptions?: boolean;
  disabled?: boolean;
};

function DropdownWrapper(props: DropdownWrapperProps) {
  const [selectedOption, setSelectedOption] = useState({
    value: props.placeholder,
  });
  const [selected, setSelected] = useState<any>([]);

  const onSelectHandler = (value?: string, option?: DropdownOption) => {
    if (props?.isMultiSelect) {
      const updatedItems: DropdownOption[] = [...selected, option];
      props.input && props.input.onChange && props.input.onChange(updatedItems);
      props.onOptionSelect && props.onOptionSelect(value, updatedItems);
    } else {
      props.input && props.input.onChange && props.input.onChange(value);
    }
  };

  const onRemoveOptions = (value: any) => {
    const updatedItems = selected.filter(
      (option: any) => option.value !== value,
    );
    props.input && props.input.onChange && props.input.onChange(updatedItems);
    props.removeSelectedOption && props.removeSelectedOption(updatedItems);
  };

  useEffect(() => {
    if (props?.isMultiSelect) {
      setSelected(props.selected);
    } else {
      if (props.input && props.input.value) {
        setSelectedOption({ value: props.input.value });
      } else if (props.placeholder) {
        setSelectedOption({ value: props.placeholder });
      }
    }
  }, [props.input, props.placeholder, props.selected]);

  return (
    <Dropdown
      allowDeselection={props.allowDeselection}
      disabled={props.disabled}
      fillOptions={props.fillOptions}
      isMultiSelect={props.isMultiSelect}
      labelRenderer={props.labelRenderer}
      onSelect={onSelectHandler}
      options={props.options}
      placeholder={props.placeholder}
      removeSelectedOption={onRemoveOptions}
      selected={
        props.isMultiSelect
          ? (props.selected as DropdownOption[])
          : selectedOption
      }
      showLabelOnly={props.showLabelOnly}
    />
  );
}

export default DropdownWrapper;
