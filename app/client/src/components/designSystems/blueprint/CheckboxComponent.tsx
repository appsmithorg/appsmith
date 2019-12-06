import * as React from "react";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { Checkbox } from "@blueprintjs/core";
class CheckboxComponent extends React.Component<CheckboxComponentProps> {
  render() {
    return (
      <Checkbox
        label={this.props.label}
        large={true}
        className={this.props.isLoading ? "bp3-skeleton" : ""}
        defaultIndeterminate={this.props.defaultCheckedState}
        onChange={this.onCheckChange}
        disabled={this.props.isDisabled}
      />
    );
  }

  onCheckChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onCheckChange(event.target.value === "true");
  };
}

export interface CheckboxComponentProps extends ComponentProps {
  label: string;
  defaultCheckedState: boolean;
  onCheckChange: (isChecked: boolean) => void;
  isLoading: boolean;
}

export default CheckboxComponent;
