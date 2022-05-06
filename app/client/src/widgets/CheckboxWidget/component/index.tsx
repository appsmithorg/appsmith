import React from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { Alignment, Checkbox, Classes } from "@blueprintjs/core";
import { AlignWidget } from "widgets/constants";
import { Colors } from "constants/Colors";

type StyledCheckboxProps = {
  checked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  rowSpace: number;
  borderRadius?: string;
  accentColor?: string;
};

type StyledCheckboxContainerProps = {
  isValid: boolean;
  noContainerPadding?: boolean;
};

const DEFAULT_BORDER_RADIUS = "0";
const DEFAULT_BACKGROUND_COLOR = Colors.GREEN_SOLID;

const CheckboxContainer = styled.div<StyledCheckboxContainerProps>`
  && {
    padding: ${({ noContainerPadding }) =>
      noContainerPadding ? 0 : "9px 12px"};
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: flex-start;
    width: 100%;
    &.${Alignment.RIGHT} {
      justify-content: flex-end;

      label {
        flex-direction: row-reverse;
      }
    }
    & .bp3-control-indicator {
      border: ${(props) =>
        !props.isValid && `1px solid ${props.theme.colors.error} !important`};
    }
  }
`;

export const StyledCheckbox = styled(Checkbox)<StyledCheckboxProps>`
  height: ${({ rowSpace }) => rowSpace}px;
  color: ${({ checked }) => (checked ? Colors.GREY_10 : Colors.GREY_9)};
  &.bp3-control.bp3-checkbox .bp3-control-indicator {
    border-radius: ${({ borderRadius }) => borderRadius};
    border: 1px solid ${Colors.GREY_3};
    box-shadow: none !important;
    outline: none !important;
    background: transparent;
    ${({ accentColor, checked, indeterminate }) =>
      checked || indeterminate
        ? `
        background-color: ${accentColor} !important;
        background-image: none;
        border: none !important;
        `
        : ``}
    ${({ checked }) =>
      checked &&
      `
      &::before {
          background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='14' height='14' /%3E%3Cpath d='M10.1039 3.5L11 4.40822L5.48269 10L2.5 6.97705L3.39613 6.06883L5.48269 8.18305L10.1039 3.5Z' fill='white'/%3E%3C/svg%3E%0A") !important;
        }
    `}
    ${({ disabled }) => (disabled ? `opacity: 0.5;` : ``)}
  }
  &:hover {
    &.bp3-control.bp3-checkbox .bp3-control-indicator {
      ${({ disabled }) =>
        disabled ? "" : `border: 1px solid ${Colors.GREY_5}`};
      ${({ checked, indeterminate }) =>
        checked || indeterminate
          ? `
        background-image: linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.2),
          rgba(0, 0, 0, 0.2)
        );
        `
          : ""};
    }
  }
  &.${Classes.CONTROL}.${Classes.DISABLED} {
    color: ${Colors.GREY_8};
  }
`;

class CheckboxComponent extends React.Component<CheckboxComponentProps> {
  render() {
    const checkboxAlignClass =
      this.props.alignWidget === "RIGHT" ? Alignment.RIGHT : Alignment.LEFT;

    // If the prop isValid has a value true/false (it was explicitly passed to this component),
    // it take priority over the internal logic to determine if the field is valid or not.
    const isValid = (() => {
      if (this.props.isValid !== undefined) {
        return this.props.isValid;
      }

      return !(this.props.isRequired && !this.props.isChecked);
    })();

    return (
      <CheckboxContainer
        className={checkboxAlignClass}
        isValid={isValid}
        noContainerPadding={this.props.noContainerPadding}
      >
        <StyledCheckbox
          accentColor={this.props.accentColor || DEFAULT_BACKGROUND_COLOR}
          alignIndicator={checkboxAlignClass}
          borderRadius={this.props.borderRadius || DEFAULT_BORDER_RADIUS}
          checked={this.props.isChecked}
          className={
            this.props.isLoading ? Classes.SKELETON : Classes.RUNNING_TEXT
          }
          disabled={this.props.isDisabled}
          inputRef={this.props.inputRef}
          label={this.props.label}
          onChange={this.onCheckChange}
          rowSpace={this.props.rowSpace}
        />
      </CheckboxContainer>
    );
  }

  onCheckChange = () => {
    this.props.onCheckChange(!this.props.isChecked);
  };
}

export interface CheckboxComponentProps extends ComponentProps {
  alignWidget?: AlignWidget;
  noContainerPadding?: boolean;
  isChecked: boolean;
  isLoading: boolean;
  isRequired?: boolean;
  isValid?: boolean;
  label: string;
  onCheckChange: (isChecked: boolean) => void;
  rowSpace: number;
  inputRef?: (el: HTMLInputElement | null) => any;
  accentColor: string;
  borderRadius: string;
}

export default CheckboxComponent;
