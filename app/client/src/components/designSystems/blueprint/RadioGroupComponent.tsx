import React from "react";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { RadioOption } from "widgets/RadioGroupWidget";
import { RadioGroup, Radio } from "@blueprintjs/core";

class RadioGroupComponent extends React.Component<RadioGroupComponentProps> {
  render() {
    return (
      <RadioGroup
        label={this.props.label}
        selectedValue={this.props.selectedOptionValue}
        onChange={this.onRadioSelectionChange}
      >
        {this.props.options.map(option => {
          return (
            <Radio
              className={this.props.isLoading ? "bp3-skeleton" : ""}
              label={option.label}
              value={option.value}
              key={option.id}
            />
          );
        })}
      </RadioGroup>
    );
  }

  onRadioSelectionChange = (event: React.FormEvent<HTMLInputElement>) => {
    this.props.onRadioSelectionChange(event.currentTarget.value);
  };
}

export interface RadioGroupComponentProps extends ComponentProps {
  label: string;
  options: RadioOption[];
  onRadioSelectionChange: (updatedOptionValue: string) => void;
  selectedOptionValue: string;
  isLoading: boolean;
}

export default RadioGroupComponent;
