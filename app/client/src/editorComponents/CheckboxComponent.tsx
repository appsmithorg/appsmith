import * as React from "react";
import { ComponentProps } from "./BaseComponent";
import { Checkbox } from "@blueprintjs/core";
import { Container } from "./ContainerComponent";
class CheckboxComponent extends React.Component<CheckboxComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        {this.props.items.map(item => (
          <Checkbox
            key={item.key}
            label={item.label}
            defaultIndeterminate={item.defaultIndeterminate}
            value={item.value}
          />
        ))}
      </Container>
    );
  }
}

export interface CheckboxComponentProps extends ComponentProps {
  items: Array<{
    key: string;
    label: string;
    defaultIndeterminate: boolean;
    value: number | string;
  }>;
}

export default CheckboxComponent;
