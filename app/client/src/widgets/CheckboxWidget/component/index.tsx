import React from "react";
import styled from "styled-components";
import type { ComponentProps } from "widgets/BaseComponent";
import { AlignWidgetTypes } from "WidgetProvider/constants";
import { Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";
import { FontStyleTypes } from "constants/WidgetConstants";
import { Checkbox } from "components/wds";

interface StyledCheckboxContainerProps {
  isValid: boolean;
  noContainerPadding?: boolean;
  labelPosition?: LabelPosition;
  minHeight?: number;
  $isFullWidth?: boolean;
}

const DEFAULT_BORDER_RADIUS = "0";
const DEFAULT_BACKGROUND_COLOR = Colors.GREEN_SOLID;

const CheckboxContainer = styled.div<StyledCheckboxContainerProps>`
  && {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: start;
    width: ${({ $isFullWidth }) => ($isFullWidth ? "100%" : "auto")};

    ${({ minHeight }) => `
    ${minHeight ? `min-height: ${minHeight}px;` : ""}`};

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
  isDynamicHeightEnabled?: boolean;
  isLabelInline?: boolean;
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

  ${({ isDynamicHeightEnabled }) =>
    isDynamicHeightEnabled ? "&& { word-break: break-all; }" : ""};

  ${({ isLabelInline }) =>
    isLabelInline &&
    `
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-wrap: normal;
  `}
`;

export const StyledCheckbox = styled(Checkbox)`
  &.bp3-control.bp3-align-right {
    padding-right: 0px;
  }
`;

class CheckboxComponent extends React.Component<CheckboxComponentProps> {
  static readonly defaultProps = {
    isFullWidth: true,
  };
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
        $isFullWidth={this.props.isFullWidth}
        isValid={isValid}
        minHeight={this.props.minHeight}
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
              isDynamicHeightEnabled={this.props.isDynamicHeightEnabled}
              isLabelInline={this.props.isLabelInline}
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputRef?: (el: HTMLInputElement | null) => any;
  accentColor: string;
  borderRadius: string;
  isDynamicHeightEnabled?: boolean;
  labelPosition: LabelPosition;
  labelTextColor?: string;
  labelTextSize?: string;
  labelStyle?: string;
  isLabelInline?: boolean;
  minHeight?: number;
  isFullWidth?: boolean;
}

export default CheckboxComponent;
