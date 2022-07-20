import React from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { Alignment, Classes } from "@blueprintjs/core";
import { AlignWidgetTypes } from "widgets/constants";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";
import { FontStyleTypes } from "constants/WidgetConstants";
import { Checkbox } from "components/wds/Checkbox";

type StyledCheckboxContainerProps = {
  isValid: boolean;
  noContainerPadding?: boolean;
};

const DEFAULT_BORDER_RADIUS = "0";
const DEFAULT_BACKGROUND_COLOR = Colors.GREEN_SOLID;

const CheckboxContainer = styled.div<StyledCheckboxContainerProps>`
  && {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: start;
    width: 100%;
  }
`;

export const CheckboxLabel = styled.div<{
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

export const StyledCheckbox = Checkbox;

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
          hasError={!isValid}
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
