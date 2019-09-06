import * as React from "react";
import { ComponentProps } from "./BaseComponent";
import { Checkbox } from "@blueprintjs/core";
import { Container } from "./ContainerComponent";
class CheckboxComponent extends React.Component<ICheckboxComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        {this.props.items.map(item => (
          <Checkbox
            label={item.label}
            defaultIndeterminate={item.defaultIndeterminate}
            value={item.value}
          />
        ))}
      </Container>
    );
  }
}

export interface ICheckboxComponentProps extends ComponentProps {
  items: Array<{
    label: string;
    defaultIndeterminate: boolean;
    value: number | string;
  }>;
}

export default CheckboxComponent;
