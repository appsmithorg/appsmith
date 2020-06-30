import React from "react";
import _ from "lodash";
import {
  BaseDropdown,
  DropdownProps,
} from "components/designSystems/appsmith/Dropdown";
import { Field } from "redux-form";

interface DropdownFieldProps {
  name: string;
  className?: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  placeholder: string;
  width?: number | string;
  isSearchable?: boolean;
  isDisabled?: boolean;
}

const DropdownField = (props: DropdownFieldProps & Partial<DropdownProps>) => {
  return (
    <Field
      name={props.name}
      className={props.className}
      component={BaseDropdown}
      options={props.options}
      placeholder={props.placeholder}
      format={(value: string) => _.find(props.options, { value }) || ""}
      normalize={(option: { value: string }) => option.value}
      {...props}
      width={props.width}
      isSearchable={props.isSearchable}
      isDisabled={props.isDisabled}
    />
  );
};

export default DropdownField;
