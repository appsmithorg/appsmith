import React from "react";
import styled from "styled-components";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { Alignment, Checkbox, Classes } from "@blueprintjs/core";
import { BlueprintControlTransform } from "constants/DefaultTheme";
import { AlignWidget } from "widgets/SwitchWidget";

const CheckboxContainer = styled.div<{ isValid: boolean }>`
  && {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    &.${Alignment.RIGHT} {
      justify-content: flex-end;
    }
    .bp3-control-indicator {
      border: ${(props) =>
        !props.isValid
          ? `1px solid ${props.theme.colors.error} !important`
          : `1px solid transparent`};
    }

    label {
      margin: 0;
      color: ${(props) =>
        !props.isValid ? `${props.theme.colors.error}` : `inherit`};
    }
  }
  ${BlueprintControlTransform}
`;
class CheckboxComponent extends React.Component<CheckboxComponentProps> {
  render() {
    const checkboxAlignClass =
      this.props.alignWidget === "RIGHT" ? Alignment.RIGHT : Alignment.LEFT;
    return (
      <CheckboxContainer
        isValid={!(this.props.isRequired && !this.props.isChecked)}
        className={checkboxAlignClass}
      >
        <Checkbox
          label={this.props.label}
          alignIndicator={checkboxAlignClass}
          className={
            this.props.isLoading ? Classes.SKELETON : Classes.RUNNING_TEXT
          }
          style={{ borderRadius: 0 }}
          onChange={this.onCheckChange}
          disabled={this.props.isDisabled}
          checked={this.props.isChecked}
        />
      </CheckboxContainer>
    );
  }

  onCheckChange = () => {
    this.props.onCheckChange(!this.props.isChecked);
  };
}

export interface CheckboxComponentProps extends ComponentProps {
  label: string;
  isChecked: boolean;
  onCheckChange: (isChecked: boolean) => void;
  isLoading: boolean;
  isRequired?: boolean;
  alignWidget?: AlignWidget;
}

export default CheckboxComponent;
