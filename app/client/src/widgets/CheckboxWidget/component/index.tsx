import React from "react";
import styled from "styled-components";
import type { ComponentProps } from "widgets/BaseComponent";
import { AlignWidgetTypes } from "WidgetProvider/types";
import { Alignment, Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";
import { FontStyleTypes } from "constants/WidgetConstants";
import { Checkbox } from "./Checkbox";
import LabelWithTooltip, {
  LABEL_CONTAINER_CLASS,
} from "widgets/components/LabelWithTooltip";

interface StyledCheckboxContainerProps {
  isValid: boolean;
  noContainerPadding?: boolean;
  labelPosition?: LabelPosition;
  minHeight?: number;
  $isFullWidth?: boolean;
  alignWidget?: AlignWidgetTypes;
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

    .${LABEL_CONTAINER_CLASS} {
      margin-right: 0px;
      max-width: 100%;
      width: 100%;
      flex: 1 1 auto;
      flex-wrap: wrap;
      justify-content: ${({ alignWidget }) =>
        alignWidget === AlignWidgetTypes.RIGHT ? "flex-end" : "flex-start"};

      label {
        text-align: ${({ alignWidget }) =>
          alignWidget === AlignWidgetTypes.RIGHT ? "right" : "left"};
        white-space: normal;
        overflow: auto;
        text-overflow: unset;
        word-break: break-word;
      }
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
        alignWidget={this.props.alignWidget}
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
            <LabelWithTooltip
              alignment={
                this.props.alignWidget === AlignWidgetTypes.RIGHT
                  ? Alignment.RIGHT
                  : Alignment.LEFT
              }
              className="t--checkbox-widget-label"
              color={this.props.labelTextColor}
              compact
              disabled={this.props.isDisabled}
              fontSize={this.props.labelTextSize}
              fontStyle={this.props.labelStyle}
              helpText={this.props.labelTooltip}
              inline={this.props.isLabelInline}
              isDynamicHeightEnabled={this.props.isDynamicHeightEnabled}
              loading={this.props.isLoading}
              optionCount={1}
              position={this.props.labelPosition}
              text={this.props.label}
            />
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
  labelTooltip?: string;
}

export default CheckboxComponent;
