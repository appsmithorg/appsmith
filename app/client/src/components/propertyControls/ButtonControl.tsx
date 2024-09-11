import React from "react";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Button } from "@appsmith/ads";
import type { WidgetProps } from "widgets/BaseWidget";

export interface OnButtonClickProps {
  props: ControlProps;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProperty: (propertyName: string, propertyValue: any) => void;
  deleteProperties: (propertyPaths: string[]) => void;
  batchUpdateProperties: (updates: Record<string, unknown>) => void;
  widgetProperties: WidgetProps;
}

export type ButtonControlProps = ControlProps & {
  onClick: (props: OnButtonClickProps) => void;
  buttonLabel: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isDisabled?: (widgetProperties: any) => boolean;
};

interface ButtonControlState {
  isLoading: boolean;
}

class ButtonControl extends BaseControl<
  ButtonControlProps,
  ButtonControlState
> {
  state = {
    isLoading: false,
  };

  onCTAClick = () => {
    this.enableLoading();
    this.props?.onClick?.({
      props: this.props,
      updateProperty: this.updateProperty,
      deleteProperties: this.deleteProperties,
      batchUpdateProperties: this.batchUpdateProperties,
      widgetProperties: this.props.widgetProperties,
    });
    this.disableLoading();
  };

  enableLoading = () => this.setState({ isLoading: true });
  disableLoading = () => this.setState({ isLoading: false });

  render() {
    const { buttonLabel, isDisabled, widgetProperties } = this.props;

    return (
      <Button
        isDisabled={isDisabled?.(widgetProperties)}
        isLoading={this.state.isLoading}
        kind="secondary"
        onClick={this.onCTAClick}
        size="sm"
      >
        {buttonLabel}
      </Button>
    );
  }

  static getControlType() {
    return "BUTTON";
  }
}

export default ButtonControl;
