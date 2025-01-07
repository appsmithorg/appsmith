import type { PropsWithChildren } from "react";
import React, { useMemo } from "react";
import styled from "styled-components";

import Tooltip from "components/editorComponents/Tooltip";
import { Colors } from "constants/Colors";
import { IconWrapper } from "constants/IconConstants";
import { FontStyleTypes } from "constants/WidgetConstants";
import { THEMEING_TEXT_SIZES } from "constants/ThemeConstants";
import { AlignWidgetTypes, type AlignWidget } from "WidgetProvider/constants";
import { LabelPosition } from "components/constants";
import { importSvg } from "@appsmith/ads-old";

const HelpIcon = importSvg(async () => import("assets/icons/control/help.svg"));

type AlignField = AlignWidget;

interface StyledLabelTextProps {
  color: string;
  fontSize: string;
  fontStyle: string;
  fontWeight: string;
  isRequiredField: boolean;
  textDecoration: string;
}

export interface LabelStyles {
  labelStyle?: string;
  labelTextColor?: string;
  labelTextSize?: string;
}

export type FieldLabelProps = PropsWithChildren<
  LabelStyles & {
    direction?: "row" | "column";
    isRequiredField?: boolean;
    label: string;
    tooltip?: string;
    alignField?: AlignField;
    labelPosition?: LabelPosition;
  }
>;

interface StyledLabelTextWrapperProps {
  direction: FieldLabelProps["direction"];
  labelPosition?: LabelPosition;
  alignField?: AlignWidget;
}

interface StyledLabelProps {
  direction?: FieldLabelProps["direction"];
}

const LABEL_TEXT_WRAPPER_MARGIN_BOTTOM = 4;
const LABEL_TEXT_MARGIN_RIGHT_WITH_REQUIRED = 2;
const TOOLTIP_CLASSNAME = "tooltip-wrapper";
// Default spacing between elements like label/tooltip etc
const DEFAULT_GAP = 10;

/**
 * align-items: flex-start is to keep fields like checkbox to always be
 * at the start even when the field label breaks to new line, otherwise
 * the checkbox might center align.
 */
const StyledLabel = styled.label<StyledLabelProps>`
  align-items: flex-start;
  display: flex;
  flex-direction: ${({ direction }) => direction};
`;

const StyledLabelTextWrapper = styled.div<StyledLabelTextWrapperProps>`
  align-items: center;
  display: flex;
  margin-bottom: ${({ direction }) =>
    direction === "row" ? 0 : LABEL_TEXT_WRAPPER_MARGIN_BOTTOM}px;

  & .${TOOLTIP_CLASSNAME} {
    line-height: 0;
  }
`;

const InlineStyledLabelTextWrapper = styled.div<StyledLabelTextWrapperProps>`
  align-items: center;
  display: flex;
  margin-bottom: ${({ direction }) =>
    direction === "row" ? 0 : LABEL_TEXT_WRAPPER_MARGIN_BOTTOM}px;

  & .${TOOLTIP_CLASSNAME} {
    line-height: 0;
  }
  ${({ alignField, labelPosition }) =>
    labelPosition === LabelPosition.Left &&
    alignField === AlignWidgetTypes.LEFT &&
    "width: 100%;"}
  ${({ alignField, labelPosition }) =>
    alignField === AlignWidgetTypes.RIGHT &&
    (labelPosition === LabelPosition.Right ||
      labelPosition === LabelPosition.Left) &&
    "margin-left: auto;"}
`;

const StyledRequiredMarker = styled.div`
  color: ${Colors.CRIMSON};
  margin-right: ${DEFAULT_GAP}px;
`;

const StyledLabelText = styled.p<StyledLabelTextProps>`
  margin-bottom: 0;
  margin-right: ${({ isRequiredField }) =>
    isRequiredField ? LABEL_TEXT_MARGIN_RIGHT_WITH_REQUIRED : DEFAULT_GAP}px;
  color: ${({ color }) => color};
  font-size: ${({ fontSize }) => fontSize};
  font-weight: ${({ fontWeight }) => fontWeight};
  font-style: ${({ fontStyle }) => fontStyle};
  text-decoration: ${({ textDecoration }) => textDecoration};
`;

const ToolTipIcon = styled(IconWrapper)`
  cursor: help;
  &&&:hover {
    svg {
      path {
        fill: #716e6e;
      }
    }
  }
`;

const StyledTooltip = styled(Tooltip)<{
  children?: React.ReactNode;
}>`
  margin-right: ${DEFAULT_GAP}px;
`;

export const BASE_LABEL_TEXT_SIZE = THEMEING_TEXT_SIZES.sm;

function FieldLabel({
  alignField = "RIGHT",
  children,
  direction = "column",
  isRequiredField = false,
  label,
  labelPosition = LabelPosition.Left,
  labelStyle,
  labelTextColor = "",
  labelTextSize,
  tooltip,
}: FieldLabelProps) {
  const labelStyleProps = useMemo(() => {
    // labelStyles contains styles as comma separated values eg. "BOLD,UNDERLINE"
    const styles = labelStyle?.split(",");

    return {
      color: labelTextColor,
      fontSize: labelTextSize || BASE_LABEL_TEXT_SIZE,
      fontWeight: styles?.includes(FontStyleTypes.BOLD) ? "bold" : "normal",
      fontStyle: styles?.includes(FontStyleTypes.ITALIC) ? "italic" : "",
      textDecoration: styles?.includes(FontStyleTypes.UNDERLINE)
        ? "underline"
        : "",
    };
  }, [labelStyle, labelTextColor, labelTextSize]);

  /**
   * If field and label are to be displayed horizontally then we consider based on the labelposition
   * prop else we always want to have label then field in case of vertical alignment (direction === "column")
   */

  if (direction !== "row") {
    return (
      <StyledLabel direction={direction}>
        <StyledLabelTextWrapper direction={direction}>
          <StyledLabelText
            isRequiredField={isRequiredField}
            {...labelStyleProps}
          >
            {label}
          </StyledLabelText>
          {isRequiredField && <StyledRequiredMarker>*</StyledRequiredMarker>}
          {tooltip && (
            <StyledTooltip
              className={TOOLTIP_CLASSNAME}
              content={tooltip}
              hoverOpenDelay={200}
              position="top"
            >
              <ToolTipIcon color={Colors.SILVER_CHALICE} height={14} width={14}>
                <HelpIcon className="t--input-widget-tooltip" />
              </ToolTipIcon>
            </StyledTooltip>
          )}
        </StyledLabelTextWrapper>
        {children}
      </StyledLabel>
    );
  } else {
    return (
      <StyledLabel direction={direction}>
        {labelPosition === LabelPosition.Right && children}
        <InlineStyledLabelTextWrapper
          alignField={alignField}
          data-testid="inlinelabel"
          direction={direction}
          labelPosition={labelPosition}
        >
          <StyledLabelText
            isRequiredField={isRequiredField}
            {...labelStyleProps}
          >
            {label}
          </StyledLabelText>
          {isRequiredField && <StyledRequiredMarker>*</StyledRequiredMarker>}
          {tooltip && (
            <StyledTooltip
              className={TOOLTIP_CLASSNAME}
              content={tooltip}
              hoverOpenDelay={200}
              position="top"
            >
              <ToolTipIcon color={Colors.SILVER_CHALICE} height={14} width={14}>
                <HelpIcon className="t--input-widget-tooltip" />
              </ToolTipIcon>
            </StyledTooltip>
          )}
        </InlineStyledLabelTextWrapper>
        {labelPosition === LabelPosition.Left && children}
      </StyledLabel>
    );
  }
}

export default FieldLabel;
