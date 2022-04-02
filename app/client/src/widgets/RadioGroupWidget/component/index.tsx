import React from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { RadioOption } from "../constants";
import { RadioGroup, Radio, Classes, Alignment } from "@blueprintjs/core";
import { TextSize } from "constants/WidgetConstants";
import { BlueprintControlTransform } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";
import LabelWithTooltip, {
  labelLayoutStyles,
} from "components/ads/LabelWithTooltip";

export interface RadioGroupContainerProps {
  compactMode: boolean;
  labelPosition?: LabelPosition;
}

export const RadioGroupContainer = styled.div<RadioGroupContainerProps>`
  ${labelLayoutStyles}
  overflow-x: hidden;
`;

export interface StyledRadioGroupProps {
  alignment: Alignment;
  compactMode: boolean;
  height?: number;
  inline: boolean;
  labelPosition?: LabelPosition;
  optionCount: number;
  scrollable: boolean;
}

const StyledRadioGroup = styled(RadioGroup)<StyledRadioGroupProps>`
  width: 100%;
  height: 100%;

  ${({ alignment, inline, optionCount }) => `
    display: ${
      inline ? "inline-flex" : alignment === Alignment.RIGHT ? "block" : "flex"
    };
    flex-direction: ${inline ? "row" : "column"};
    align-items: ${inline ? "center" : "flex-start"};
    ${inline && "flex-wrap: wrap"};
    justify-content: ${
      optionCount > 1 ? `space-between` : inline ? `flex-start` : `center`
    };
  `}

  ${BlueprintControlTransform};
  .${Classes.CONTROL} {
    display: ${({ alignment, inline }) => {
      if (alignment === Alignment.RIGHT) {
        return inline ? "inline-block" : "block";
      }
      return "flex";
    }};
    align-items: center;
    border: 1px solid transparent;
    color: ${Colors.GREY_10};
    line-height: 16px;
    min-height: ${({ alignment }) =>
      alignment === Alignment.RIGHT ? 23 : 30}px;
    margin-top: ${({ alignment }) => (alignment === Alignment.RIGHT ? 7 : 0)}px;

    margin-bottom: ${({
      alignment,
      height,
      inline,
      labelPosition,
      optionCount,
    }) => {
      if (
        alignment === Alignment.RIGHT &&
        !inline &&
        optionCount > 1 &&
        height
      ) {
        return Math.max(
          (height -
            (labelPosition === LabelPosition.Left ? 0 : 35) -
            optionCount * 31) /
            (optionCount - 1),
          8,
        );
      } else {
        return 0;
      }
    }}px;

    &:last-child {
      margin-bottom: 0;
    }
    .bp3-control-indicator {
      margin-top: 0;
      border: 1px solid ${Colors.GREY_3};
    }
    input:checked ~ .bp3-control-indicator,
    &:hover input:checked ~ .bp3-control-indicator {
      background-color: ${Colors.GREEN};
    }
    &:hover {
      & input:not(:checked) ~ .bp3-control-indicator {
        border: 1px solid ${Colors.GREY_5} !important;
      }
    }
  }
`;

class RadioGroupComponent extends React.Component<
  RadioGroupComponentProps,
  RadioGroupComponentState
> {
  private containerRef: React.RefObject<HTMLDivElement>;
  constructor(props: RadioGroupComponentProps) {
    super(props);
    this.containerRef = React.createRef();
    this.state = {
      scrollable: false,
    };
  }

  componentDidUpdate(prevProps: RadioGroupComponentProps) {
    if (
      prevProps.height !== this.props.height ||
      prevProps.width !== this.props.width ||
      prevProps.labelText !== this.props.labelText ||
      prevProps.labelPosition !== this.props.labelPosition ||
      prevProps.labelWidth !== this.props.labelWidth ||
      prevProps.inline !== this.props.inline ||
      JSON.stringify(prevProps.options) !== JSON.stringify(this.props.options)
    ) {
      const containerElement = this.containerRef.current;
      this.setState({
        scrollable: containerElement
          ? containerElement.scrollHeight > containerElement.clientHeight
            ? true
            : false
          : false,
      });
    }
  }

  render() {
    const {
      alignment,
      compactMode,
      disabled,
      height,
      inline,
      labelAlignment,
      labelPosition,
      labelStyle,
      labelText,
      labelTextColor,
      labelTextSize,
      labelWidth,
      loading,
      options,
      selectedOptionValue,
    } = this.props;

    const optionCount = (options || []).length;

    return (
      <RadioGroupContainer
        compactMode={compactMode}
        data-testid="radiogroup-container"
        labelPosition={labelPosition}
        ref={this.containerRef}
      >
        {labelText && (
          <LabelWithTooltip
            alignment={labelAlignment}
            className={`radiogroup-label`}
            color={labelTextColor}
            compact={compactMode}
            disabled={disabled}
            fontSize={labelTextSize}
            fontStyle={labelStyle}
            inline={inline}
            loading={loading}
            optionCount={optionCount}
            position={labelPosition}
            text={labelText}
            width={labelWidth}
          />
        )}
        <StyledRadioGroup
          alignment={alignment}
          compactMode={compactMode}
          disabled={disabled}
          height={height}
          inline={inline}
          labelPosition={labelPosition}
          onChange={this.onRadioSelectionChange}
          optionCount={options.length}
          scrollable={this.state.scrollable}
          selectedValue={selectedOptionValue}
        >
          {options.map((option, optInd) => {
            return (
              <Radio
                alignIndicator={alignment}
                className={loading ? "bp3-skeleton" : ""}
                inline={inline}
                key={optInd}
                label={option.label}
                value={option.value}
              />
            );
          })}
        </StyledRadioGroup>
      </RadioGroupContainer>
    );
  }

  onRadioSelectionChange = (event: React.FormEvent<HTMLInputElement>) => {
    this.props.onRadioSelectionChange(event.currentTarget.value);
  };
}

export interface RadioGroupComponentProps extends ComponentProps {
  options: RadioOption[];
  onRadioSelectionChange: (updatedOptionValue: string) => void;
  selectedOptionValue: string;
  disabled: boolean;
  loading: boolean;
  inline: boolean;
  alignment: Alignment;
  compactMode: boolean;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  labelWidth?: number;
  widgetId: string;
  height?: number;
  width?: number;
}

interface RadioGroupComponentState {
  scrollable: boolean;
}

export default RadioGroupComponent;
