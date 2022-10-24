import React from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { Classes } from "@blueprintjs/core";
import { AlignWidgetTypes } from "widgets/constants";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";
import { FontStyleTypes } from "constants/WidgetConstants";
import { Checkbox } from "components/wds/Checkbox";

type StyledCheckboxContainerProps = {
  isValid: boolean;
  noContainerPadding?: boolean;
  labelPosition?: LabelPosition;
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

    .${Classes.CHECKBOX} {
      width: 100%;
    }
  }
`;

export const CheckboxLabel = styled.div<{
  disabled?: boolean;
  alignment: AlignWidgetTypes;
  labelTextColor?: string;
  labelTextSize?: string;
  labelStyle?: string;
}>`
  width: 100%;
  display: inline-block;
  vertical-align: top;
  text-align: ${({ alignment }) => alignment.toLowerCase()};
  ${({ disabled, labelStyle, labelTextColor, labelTextSize }) => `
  color: ${
    disabled ? "var(--wds-color-text-disabled)" : labelTextColor || "inherit"
  };
  font-size: ${labelTextSize ?? "inherit"};
  font-weight: ${labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-style: ${
    labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : "normal"
  };
  `}
`;

export const StyledCheckbox = styled(Checkbox)`
  &.bp3-control.bp3-align-right {
    padding-right: 0px;
  }
`;

class CheckboxComponent extends React.Component<CheckboxComponentProps> {
  render() {
    /**
     * When the label position is left align checkbox to the right
     * When the label position is right align checkbox to the left
     */
    const checkboxAlignClass =
      this.props.labelPosition === LabelPosition.Right ? "left" : "right";

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
              alignment={this.props.alignWidget || AlignWidgetTypes.LEFT}
              className="t--checkbox-widget-label"
              disabled={this.props.isDisabled}
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
  inputRef?: (el: HTMLInputElement | null) => any;
  accentColor: string;
  borderRadius: string;
  labelPosition: LabelPosition;
  labelTextColor?: string;
  labelTextSize?: string;
  labelStyle?: string;
}

export default CheckboxComponent;
