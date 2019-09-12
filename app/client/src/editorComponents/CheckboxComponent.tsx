import * as React from "react";
import { ComponentProps } from "./BaseComponent";
import { Checkbox } from "@blueprintjs/core";
import { Container } from "./ContainerComponent";
class CheckboxComponent extends React.Component<ICheckboxComponentProps> {
  render() {
    return (
          <Checkbox
            label={this.props.label}
            defaultIndeterminate={this.props.defaultCheckedState}
            />
    );
  }
}

export interface ICheckboxComponentProps extends ComponentProps {
  label: string
  defaultCheckedState: boolean
}

export default CheckboxComponent;
