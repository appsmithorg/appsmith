import React from "react";
import _ from "lodash";
import { BaseDropdown } from "../canvas/Dropdown";
import { Field } from "redux-form";

interface DropdownFieldProps {
  name: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  placeholder: string;
}

const DropdownField = (props: DropdownFieldProps) => {
  return (
    <Field
      name={props.name}
      component={BaseDropdown}
      options={props.options}
      placeholder={props.placeholder}
      format={(value: string) => _.find(props.options, { value })}
      normalize={(option: { value: string }) => option.value}
    />
  );
};

export default DropdownField;
