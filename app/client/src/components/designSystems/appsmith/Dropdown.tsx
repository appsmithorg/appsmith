import React from "react";
import Select from "react-select";

import type { WrappedFieldInputProps } from "redux-form";
import type { SelectComponentsConfig } from "react-select/src/components";
import { LayersContext } from "constants/Layers";
import { Colors } from "constants/Colors";

export interface DropdownProps {
  options: Array<{
    value: string;
    label?: string;
  }>;
  input: WrappedFieldInputProps;
  placeholder: string;
  width?: number | string;
  isSearchable?: boolean;
  isDisabled?: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customSelectStyles?: any;
  maxMenuHeight: number;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: SelectComponentsConfig<any>;
}

const selectStyles = {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  placeholder: (provided: any) => ({
    ...provided,
    color: "#a3b3bf",
  }),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: "30px",
  }),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearIndicator: (provided: any) => ({
    ...provided,
    padding: "5px",
  }),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dropdownIndicator: (provided: any) => ({
    ...provided,
    padding: "5px",
  }),
  indicatorSeparator: () => ({}),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menu: (provided: any) => ({
    ...provided,
    zIndex: 2,
    backgroundColor: Colors.GREY_1,
    borderRadius: 0,
  }),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menuPortal: (base: any) => ({ ...base, zIndex: 2 }),
};

export function BaseDropdown(props: DropdownProps) {
  const layer = React.useContext(LayersContext);
  const { customSelectStyles, input, placeholder } = props;
  const menuPortalStyle = {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
