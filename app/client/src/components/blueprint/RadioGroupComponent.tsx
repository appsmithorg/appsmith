import React from "react";
import { ComponentProps } from "../appsmith/BaseComponent";
import { Container } from "../appsmith/ContainerComponent";
import { RadioOption } from "../../widgets/RadioGroupWidget";
class RadioGroupComponent extends React.Component<RadioGroupComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <div />
      </Container>
    );
  }
}

export interface RadioGroupComponentProps extends ComponentProps {
  label: string;
  options: RadioOption[];
  defaultOptionValue: string;
}

export default RadioGroupComponent;
