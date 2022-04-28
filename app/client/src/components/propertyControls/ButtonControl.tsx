import React from "react";

import BaseControl, { ControlProps } from "./BaseControl";
import styled from "constants/DefaultTheme";
import { StyledPropertyPaneButton } from "./StyledControls";
import { Category, Size } from "components/ads/Button";

export type OnButtonClickProps = {
  props: ControlProps;
  updateProperty: (propertyName: string, propertyValue: any) => void;
  deleteProperties: (propertyPaths: string[]) => void;
  batchUpdateProperties: (updates: Record<string, unknown>) => void;
};

export type ButtonControlProps = ControlProps & {
  onClick: (props: OnButtonClickProps) => void;
  buttonLabel: string;
  isDisabled?: (widgetProperties: any) => boolean;
};

type ButtonControlState = {
  isLoading: boolean;
};

const StyledButton = styled(StyledPropertyPaneButton)`
  width: 100%;
  display: flex;
  justify-content: center;
  &&&& {
    margin: 0;
  }
`;

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
    });
    this.disableLoading();
  };

  enableLoading = () => this.setState({ isLoading: true });
  disableLoading = () => this.setState({ isLoading: false });

  render() {
    const { buttonLabel, isDisabled, widgetProperties } = this.props;

    return (
      <StyledButton
        category={Category.tertiary}
        disabled={isDisabled?.(widgetProperties)}
        isLoading={this.state.isLoading}
        onClick={this.onCTAClick}
        size={Size.medium}
        tag="button"
        text={buttonLabel}
        type="button"
      />
    );
  }

  static getControlType() {
    return "BUTTON";
  }
}

export default ButtonControl;
