import React from "react";
import { Field, BaseFieldProps } from "redux-form";
import DropdownComponent from "components/editorComponents/DropdownComponent";
import { ButtonStyleName } from "components/designSystems/blueprint/ButtonComponent";
import { DropdownOption } from "widgets/DropdownWidget";

interface DynamicDropdownFieldOptions {
  options: DropdownOption[];
  accent?: ButtonStyleName;
  filled?: boolean;
  width?: string;
}

type DynamicDropdownFieldProps = BaseFieldProps & DynamicDropdownFieldOptions;

class DynamicDropdownField extends React.Component<
  DynamicDropdownFieldProps,
  {
    selectedOption: DropdownOption;
  }
> {
  constructor(props: DynamicDropdownFieldProps) {
    super(props);
    this.state = {
      selectedOption: this.props.options[0],
    };
  }

  handleOptionSelection = (selectedValue: string): void => {
    const selectedOption = this.props.options.find(
      (option) => option.value === selectedValue,
    ) as DropdownOption;
    this.setState({
      selectedOption,
    });
  };

  render() {
    const dropdownProps = {
      selectHandler: this.handleOptionSelection,
      selected: this.state.selectedOption,
    };

    return (
      <Field component={DropdownComponent} {...this.props} {...dropdownProps} />
    );
  }
}

export default DynamicDropdownField;
