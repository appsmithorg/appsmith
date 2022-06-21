import React from "react";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import { DropdownOption } from "components/ads";
import DropdownWrapper from "./DropdownWrapper";

const renderComponent = (
  componentProps: SelectFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  return <DropdownWrapper {...componentProps} />;
};

export type DropdownOnSelect = (value?: string, dropdownOption?: any) => void;

type SelectFieldProps = {
  allowDeselection?: boolean;
  isMultiSelect?: boolean;
  name: string;
  placeholder: string;
  onSelect?: (val: any, option: any) => void;
  options: Partial<DropdownOption>[];
  selected?: Partial<DropdownOption> | Partial<DropdownOption>[];
  size?: "large" | "small";
  outline?: boolean;
  removeSelectedOption?: DropdownOnSelect;
  showLabelOnly?: boolean;
  labelRenderer?: (selected: Partial<DropdownOption>[]) => JSX.Element;
  fillOptions?: boolean;
  disabled?: boolean;
};

export function SelectField(props: SelectFieldProps) {
  return (
    <Field
      allowDeselection={props.allowDeselection}
      component={renderComponent}
      disabled={props.disabled}
      fillOptions={props.fillOptions}
      isMultiSelect={props.isMultiSelect}
      labelRenderer={props.labelRenderer}
      name={props.name}
      onOptionSelect={props.onSelect}
      options={props.options}
      outline={props.outline}
      placeholder={props.placeholder}
      removeSelectedOption={props.removeSelectedOption}
      selected={props.selected}
      showLabelOnly={props.showLabelOnly}
      size={props.size}
    />
  );
}

export default SelectField;
