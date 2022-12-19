import { Dropdown, DropdownOption, RenderOption } from "design-system";
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
  onOptionSelect?: (
    value?: string,
    option?: DropdownOption[] | DropdownOption,
  ) => void;
  removeSelectedOption?: DropdownOnSelect;
  selected?: DropdownOption | DropdownOption[];
  showLabelOnly?: boolean;
  labelRenderer?: (selected: Partial<DropdownOption>[]) => JSX.Element;
  fillOptions?: boolean;
  disabled?: boolean;
  renderOption?: RenderOption;
  dropdownMaxHeight?: string;
  enableSearch?: boolean;
};

function DropdownWrapper(props: DropdownWrapperProps) {
  const [selectedOption, setSelectedOption] = useState<any>([
    {
      value: props.placeholder,
    },
  ]);

  const onSelectHandler = (value?: string, option?: DropdownOption) => {
    if (props?.isMultiSelect) {
      const updatedItems: DropdownOption[] = [...selectedOption, option];
      props.input && props.input.onChange && props.input.onChange(updatedItems);
      props.onOptionSelect && props.onOptionSelect(value, updatedItems);
    } else {
      props.input && props.input.onChange && props.input.onChange(value);
      props.onOptionSelect && props.onOptionSelect(value, option);
    }
  };

  const onRemoveOptions = (value: any) => {
    const updatedItems = selectedOption.filter(
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
    <Dropdown
      allowDeselection={props.allowDeselection}
      disabled={props.disabled}
      dropdownMaxHeight={props.dropdownMaxHeight}
      enableSearch={props.enableSearch}
      fillOptions={props.fillOptions}
      isMultiSelect={props.isMultiSelect}
      labelRenderer={props.labelRenderer}
      onSelect={onSelectHandler}
      options={props.options}
      placeholder={props.placeholder}
      removeSelectedOption={onRemoveOptions}
      renderOption={props?.renderOption}
      selected={props.isMultiSelect ? selectedOption : selectedOption[0]}
      showLabelOnly={props.showLabelOnly}
    />
  );
}

export default DropdownWrapper;
