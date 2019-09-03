import * as React from "react"
import { IComponentProps } from "./BaseComponent"
import { Radio, RadioGroup, IOptionProps } from "@blueprintjs/core"
import { Container } from "./ContainerComponent"
class RadioGroupComponent extends React.Component<RadioGroupComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <RadioGroup
          inline={this.props.inline}
          label={this.props.label}
          name={this.props.name}
          onChange={this.props.handleRadioChange}
          selectedValue={this.props.selectedValue}
          disabled={this.props.disabled}
          className={this.props.className}
          options={this.props.options}
        >
          {this.props.items.map(item => (
            <Radio label={item.label} value={item.value} />
          ))}
        </RadioGroup>
      </Container>
    )
  }
}

export interface RadioGroupComponentProps extends IComponentProps {
  label: string;
  inline: boolean;
  selectedValue: string | number;
  handleRadioChange: (event: React.FormEvent<HTMLInputElement>) => void;
  disabled: boolean;
  className: string;
  name: string;
  options: IOptionProps[];
  items: Array<{
    label: string;
    value: number | string;
  }>;
}

export default RadioGroupComponent
