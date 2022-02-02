import React, { PropsWithChildren, useMemo } from "react";
import styled from "styled-components";
import { Position } from "@blueprintjs/core";

import Tooltip from "components/editorComponents/Tooltip";
import { Colors } from "constants/Colors";
import { ReactComponent as HelpIcon } from "assets/icons/control/help.svg";
import { IconWrapper } from "constants/IconConstants";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";

type StyledLabelTextProps = {
  color: string;
  fontSize: string;
  fontStyle: string;
  fontWeight: string;
  isRequiredField: boolean;
  textDecoration: string;
};

export type LabelStyles = {
  labelStyle?: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
};

export type FieldLabelProps = PropsWithChildren<
  LabelStyles & {
    direction?: "row" | "column";
    isRequiredField?: boolean;
    label: string;
    tooltip?: string;
  }
>;

type StyledLabelTextWrapperProps = {
  direction: FieldLabelProps["direction"];
};

type StyledLabelProps = {
  direction?: FieldLabelProps["direction"];
};

const LABEL_TEXT_WRAPPER_MARGIN_BOTTOM = 4;
const LABEL_TEXT_MARGIN_RIGHT_WITH_REQUIRED = 2;
const LABEL_TEXT_MARGIN_RIGHT_DEFAULT = 10;
const TOOLTIP_CLASSNAME = "tooltip-wrapper";

const StyledLabel = styled.label<StyledLabelProps>`
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

const StyledRequiredMarker = styled.div`
  color: ${Colors.CRIMSON};
  margin-right: ${LABEL_TEXT_MARGIN_RIGHT_DEFAULT}px;
`;

const StyledLabelText = styled.p<StyledLabelTextProps>`
  margin-bottom: 0;
  margin-right: ${({ isRequiredField }) =>
    isRequiredField
      ? LABEL_TEXT_MARGIN_RIGHT_WITH_REQUIRED
      : LABEL_TEXT_MARGIN_RIGHT_DEFAULT}px;
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

function FieldLabel({
  children,
  direction = "column",
  isRequiredField = false,
  label,
  labelStyle,
  labelTextColor = "",
  labelTextSize = "PARAGRAPH",
  tooltip,
}: FieldLabelProps) {
  const labelStyleProps = useMemo(() => {
    // labelStyles contains styles as comma separated values eg. "BOLD,UNDERLINE"
    const styles = labelStyle?.split(",");
    return {
      color: labelTextColor,
      fontSize: TEXT_SIZES[labelTextSize],
      fontWeight: styles?.includes(FontStyleTypes.BOLD) ? "bold" : "normal",
      fontStyle: styles?.includes(FontStyleTypes.ITALIC) ? "italic" : "",
      textDecoration: styles?.includes(FontStyleTypes.UNDERLINE)
        ? "underline"
        : "",
    };
  }, [labelStyle, labelTextColor, labelTextSize]);

  return (
    <StyledLabel direction={direction}>
      <StyledLabelTextWrapper direction={direction}>
        <StyledLabelText isRequiredField={isRequiredField} {...labelStyleProps}>
          {label}
        </StyledLabelText>
        {isRequiredField && <StyledRequiredMarker>*</StyledRequiredMarker>}
        {tooltip && (
          <Tooltip
            className={TOOLTIP_CLASSNAME}
            content={tooltip}
            hoverOpenDelay={200}
            position={Position.TOP}
          >
            <ToolTipIcon color={Colors.SILVER_CHALICE} height={14} width={14}>
              <HelpIcon className="t--input-widget-tooltip" />
            </ToolTipIcon>
          </Tooltip>
        )}
      </StyledLabelTextWrapper>
      {children}
    </StyledLabel>
  );
}

export default FieldLabel;
