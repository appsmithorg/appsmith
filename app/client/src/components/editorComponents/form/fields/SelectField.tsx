import React from "react";
import type { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";
import { Field } from "redux-form";
import DropdownWrapper from "./DropdownWrapper";
import type { SelectOptionProps } from "@appsmith/ads";

const renderComponent = (
  componentProps: SelectFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  return <DropdownWrapper {...componentProps} />;
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DropdownOnSelect = (value?: string, dropdownOption?: any) => void;

interface SelectFieldProps {
  allowDeselection?: boolean;
  isMultiSelect?: boolean;
  name: string;
  placeholder: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelect?: (val: any, option: any) => void;
  options: Partial<SelectOptionProps>[];
  selected?: Partial<SelectOptionProps> | Partial<SelectOptionProps>[];
  size?: "large" | "small";
  outline?: boolean;
  removeSelectedOption?: DropdownOnSelect;
  showLabelOnly?: boolean;
  labelRenderer?: (selected: Partial<SelectOptionProps>[]) => JSX.Element;
  fillOptions?: boolean;
  disabled?: boolean;
  dropdownMaxHeight?: string;
  enableSearch?: boolean;
  testId?: string;
}

export function SelectField(props: SelectFieldProps) {
  return (
    <Field
      allowDeselection={props.allowDeselection}
      component={renderComponent}
      disabled={props.disabled}
      dropdownMaxHeight={props.dropdownMaxHeight}
      enableSearch={props.enableSearch}
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
      testId={props.testId}
    />
  );
}

export default SelectField;
