import React from "react";
import _ from "lodash";
import {
  BaseDropdown,
  DropdownProps,
} from "components/designSystems/appsmith/Dropdown";
import { Field } from "redux-form";
import { replayHighlightClass } from "globalStyles/portals";

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
  customStyles?: any; // Object to allow for custom styles for the dropdown
}

function DropdownField(props: DropdownFieldProps & Partial<DropdownProps>) {
  return (
    <Field
      className={`${props.className} ${replayHighlightClass}`}
      component={BaseDropdown}
      format={(value: string) => _.find(props.options, { value }) || ""}
      normalize={(option: { value: string }) => option.value}
      {...props}
      isDisabled={props.isDisabled}
      isSearchable={props.isSearchable}
      placeholder={props.placeholder}
      width={props.width}
    />
  );
}

export default DropdownField;
