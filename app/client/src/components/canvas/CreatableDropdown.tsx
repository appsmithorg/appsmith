import React from "react";
import Creatable from "react-select/creatable";

type DropdownProps = {
  options: Array<{
    value: string;
    label: string;
  }>;
  placeholder: string;
};

const selectStyles = {
  container: (styles: any) => ({
    ...styles,
    flex: 1,
  }),
};

class CreatableDropdown extends React.Component<DropdownProps> {
  render() {
    return (
      <Creatable
        placeholder={this.props.placeholder}
        options={this.props.options}
        styles={selectStyles}
      />
    );
  }
}

export default CreatableDropdown;
