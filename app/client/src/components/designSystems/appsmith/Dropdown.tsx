import React from "react";
import Select from "react-select";

import { WrappedFieldInputProps } from "redux-form";
import { SelectComponentsConfig } from "react-select/src/components";
import { LayersContext } from "../../../constants/Layers";
import { Colors } from "constants/Colors";

export type DropdownProps = {
  options: Array<{
    value: string;
    label?: string;
  }>;
  input: WrappedFieldInputProps;
  placeholder: string;
  width?: number | string;
  isSearchable?: boolean;
  isDisabled?: boolean;
  customSelectStyles?: any;
  maxMenuHeight: number;
  components?: SelectComponentsConfig<any>;
};

const selectStyles = {
  placeholder: (provided: any) => ({
    ...provided,
    color: "#a3b3bf",
  }),
  control: (styles: any, state: any) => ({
    ...styles,
    width: state.selectProps.width || 100,
    minHeight: "36px",
    border: state.isFocused
      ? `var(--appsmith-input-focus-border-color) solid 1px`
      : `${Colors.ALTO2} solid 1px`,
    boxShadow: state.isFocused ? 0 : 0,
    padding: "1px 3px 1px",
    "border-radius": "0px",
    "&:hover": {
      background: "#FAFAFA",
    },
  }),
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: "30px",
  }),
  clearIndicator: (provided: any) => ({
    ...provided,
    padding: "5px",
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    padding: "5px",
  }),
  indicatorSeparator: () => ({}),
  menu: (provided: any) => ({
    ...provided,
    zIndex: 2,
    backgroundColor: Colors.GREY_1,
    borderRadius: 0,
  }),
  menuPortal: (base: any) => ({ ...base, zIndex: 2 }),
};

export function BaseDropdown(props: DropdownProps) {
  const layer = React.useContext(LayersContext);
  const { customSelectStyles, input, placeholder } = props;
  const menuPortalStyle = {
    menuPortal: (styles: any) => ({ ...styles, zIndex: layer.max }),
  };

  return (
    <Select
      menuPortalTarget={document.body}
      styles={{ ...selectStyles, ...customSelectStyles, ...menuPortalStyle }}
      {...input}
      isDisabled={props.isDisabled}
      isSearchable={props.isSearchable}
      onChange={(value) => input.onChange(value)}
      width={props.width}
      {...props}
      classNamePrefix="appsmith-select"
      menuPlacement="auto"
      placeholder={placeholder}
    />
  );
}

function Dropdown(props: DropdownProps) {
  return <BaseDropdown {...props} />;
}

export default Dropdown;
