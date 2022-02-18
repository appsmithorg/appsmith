import React from "react";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import { RadioOption } from "../constants";
import {
  RadioGroup,
  Radio,
  Label,
  Classes,
  Alignment,
  Position,
} from "@blueprintjs/core";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";
import { BlueprintControlTransform } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { LabelPosition, LABEL_MAX_WIDTH_RATE } from "components/constants";
import Tooltip from "components/ads/Tooltip";

export interface RadioGroupContainerProps {
  compactMode: boolean;
  labelPosition?: LabelPosition;
}

export const RadioGroupContainer = styled.div<RadioGroupContainerProps>`
  display: flex;
  flex-direction: ${({ compactMode, labelPosition }) => {
    if (labelPosition === LabelPosition.Left) return "row";
    if (labelPosition === LabelPosition.Top) return "column";
    if (compactMode) return "row";
    return "column";
  }};

  align-items: ${({ compactMode, labelPosition }) => {
    if (labelPosition === LabelPosition.Top) return "flex-start";
    if (compactMode || labelPosition === LabelPosition.Left) return "center";
    return "flex-start";
  }};

  overflow-x: hidden;

  label.radiogroup-label {
    ${({ compactMode, labelPosition }) => {
      if (labelPosition === LabelPosition.Top)
        return "margin-bottom: 5px; margin-right: 0px";
      if (compactMode || labelPosition === LabelPosition.Left)
        return "margin-bottom: 0px; margin-right: 5px";
      return "margin-bottom: 5px; margin-right: 0px";
    }};
  }
`;

export interface LabelContainerProps {
  inline: boolean;
  optionCount: number;
  compactMode: boolean;
  alignment?: Alignment;
  position?: LabelPosition;
  width?: number;
}

export const LabelContainer = styled.div<LabelContainerProps>`
  display: flex;
  ${({ alignment, compactMode, inline, optionCount, position, width }) => `
    ${
      position !== LabelPosition.Top &&
      (position === LabelPosition.Left || compactMode)
        ? `&&& {margin-right: 5px; flex-shrink: 0;} max-width: ${LABEL_MAX_WIDTH_RATE}%;`
        : `width: 100%;`
    }
    ${position === LabelPosition.Left &&
      `
      ${!width && `width: 33%`};
      ${alignment === Alignment.RIGHT && `justify-content: flex-end`};
      label {
        ${width && `width: ${width}px`};
        ${
          alignment === Alignment.RIGHT
            ? `text-align: right`
            : `text-align: left`
        };
      }
    `}

    ${!inline && optionCount > 1 && `align-self: flex-start;`}
  `}
`;

export interface StyledLabelProps {
  disabled: boolean;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
}

export const StyledLabel = styled(Label)<StyledLabelProps>`
  ${({ disabled, labelStyle, labelTextColor, labelTextSize }) => `
    color: ${disabled ? Colors.GREY_8 : labelTextColor || "inherit"};
    font-size: ${labelTextSize ? TEXT_SIZES[labelTextSize] : "14px"};
    font-weight: ${
      labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"
    };
    font-style: ${
      labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : "normal"
    };
  `}
`;

export const StyledTooltip = styled(Tooltip)`
  overflow: hidden;
`;

export interface StyledRadioGroupProps {
  alignment: Alignment;
  compactMode: boolean;
  inline: boolean;
  optionCount: number;
  scrollable: boolean;
}

const StyledRadioGroup = styled(RadioGroup)<StyledRadioGroupProps>`
  display: block;

  ${({ inline, optionCount }) =>
    !inline && optionCount > 1 && `align-self: flex-start`};

  ${({ compactMode, inline, optionCount, scrollable }) =>
    inline && compactMode && optionCount > 1 && scrollable && `height: 100%`};

  ${BlueprintControlTransform};
  .${Classes.CONTROL} {
    margin-bottom: 0;
    border: 1px solid transparent;
    color: ${Colors.GREY_10};

    ${({ alignment, inline }) =>
      (inline || alignment === Alignment.RIGHT) && `line-height: 16px`};

    ${({ alignment, inline }) =>
      alignment === Alignment.RIGHT &&
      (inline ? `display: inline-block` : `display: block`)};

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

    ${({ alignment, inline, optionCount, scrollable }) =>
      (scrollable || (!inline && optionCount > 1)) &&
      (alignment === Alignment.LEFT
        ? `margin-bottom: 16px`
        : `min-height: 30px`)};

    ${({ compactMode, inline, optionCount }) =>
      (inline || optionCount === 1) && compactMode && `margin-bottom: 0`};
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
      hasLabelEllipsis: false,
      scrollable: false,
    };
  }

  componentDidMount() {
    this.setState({ hasLabelEllipsis: this.checkHasLabelEllipsis() });
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
        hasLabelEllipsis: this.checkHasLabelEllipsis(),
        scrollable: containerElement
          ? containerElement.scrollHeight > containerElement.clientHeight
            ? true
            : false
          : false,
      });
    }
  }

  checkHasLabelEllipsis = () => {
    const labelElement = document.querySelector(
      `.appsmith_widget_${this.props.widgetId} .radiogroup-label`,
    );

    if (labelElement) {
      return labelElement.scrollWidth > labelElement.clientWidth;
    }

    return false;
  };

  render() {
    const {
      alignment,
      compactMode,
      disabled,
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
          <LabelContainer
            alignment={labelAlignment}
            compactMode={compactMode}
            inline={inline}
            optionCount={optionCount}
            position={labelPosition}
            width={labelWidth}
          >
            {this.state.hasLabelEllipsis ? (
              <StyledTooltip
                content={labelText}
                hoverOpenDelay={200}
                position={Position.TOP}
              >
                <StyledLabel
                  className={`radiogroup-label ${Classes.TEXT_OVERFLOW_ELLIPSIS}`}
                  disabled={disabled}
                  labelStyle={labelStyle}
                  labelTextColor={labelTextColor}
                  labelTextSize={labelTextSize}
                >
                  {labelText}
                </StyledLabel>
              </StyledTooltip>
            ) : (
              <StyledLabel
                className={`radiogroup-label ${Classes.TEXT_OVERFLOW_ELLIPSIS}`}
                disabled={disabled}
                labelStyle={labelStyle}
                labelTextColor={labelTextColor}
                labelTextSize={labelTextSize}
              >
                {labelText}
              </StyledLabel>
            )}
          </LabelContainer>
        )}
        <StyledRadioGroup
          alignment={alignment}
          compactMode={compactMode}
          disabled={disabled}
          inline={inline}
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
  labelWidth: number;
  widgetId: string;
  height: number;
  width: number;
}

interface RadioGroupComponentState {
  hasLabelEllipsis: boolean;
  scrollable: boolean;
}

export default RadioGroupComponent;
