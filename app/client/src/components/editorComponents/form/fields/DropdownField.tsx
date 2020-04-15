import React from "react";
import _ from "lodash";
import { BaseDropdown } from "components/designSystems/appsmith/Dropdown";
import { Field } from "redux-form";

interface DropdownFieldProps {
  name: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  placeholder: string;
  width?: number;
  isSearchable?: boolean;
  isDisabled?: boolean;
}

const DropdownField = (props: DropdownFieldProps) => {
  return (
    <Field
      name={props.name}
      component={BaseDropdown}
      options={props.options}
      placeholder={props.placeholder}
      format={(value: string) => _.find(props.options, { value }) || ""}
      normalize={(option: { value: string }) => option.value}
      width={props.width}
      isSearchable={props.isSearchable}
      isDisabled={props.isDisabled}
    />
  );
};

export default DropdownField;
