import React from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { Alignment, Checkbox, Classes } from "@blueprintjs/core";
import { AlignWidgetTypes } from "widgets/constants";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";
import { FontStyleTypes } from "constants/WidgetConstants";

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
    .${Classes.CHECKBOX} {
      width: 100%;
    }
    & .bp3-control-indicator {
      border: ${(props) =>
        !props.isValid && `1px solid ${props.theme.colors.error} !important`};
    }
  }
`;

const CheckboxLabel = styled.div<{
  disabled?: boolean;
  labelPosition: LabelPosition;
  labelTextColor?: string;
  labelTextSize?: string;
  labelStyle?: string;
}>`
  width: 100%;
  display: inline-block;
  vertical-align: top;
  text-align: ${({ labelPosition }) => labelPosition.toLowerCase()};
  ${({ disabled, labelStyle, labelTextColor, labelTextSize }) => `
  color: ${disabled ? Colors.GREY_8 : labelTextColor || "inherit"};
  font-size: ${labelTextSize ?? "inherit"};
  font-weight: ${labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-style: ${
    labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : "normal"
  };
  `}
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
      this.props.alignWidget === AlignWidgetTypes.RIGHT
        ? Alignment.RIGHT
        : Alignment.LEFT;

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
          labelElement={
            <CheckboxLabel
              className="t--checkbox-widget-label"
              disabled={this.props.isDisabled}
              labelPosition={this.props.labelPosition}
              labelStyle={this.props.labelStyle}
              labelTextColor={this.props.labelTextColor}
              labelTextSize={this.props.labelTextSize}
            >
              {this.props.label}
            </CheckboxLabel>
          }
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
  alignWidget?: AlignWidgetTypes;
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
  labelPosition: LabelPosition;
  labelTextColor?: string;
  labelTextSize?: string;
  labelStyle?: string;
}

export default CheckboxComponent;
