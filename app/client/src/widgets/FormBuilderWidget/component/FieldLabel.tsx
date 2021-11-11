import React, { PropsWithChildren } from "react";
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
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
};

const LABEL_TEXT_WRAPPER_MARGIN_BOTTOM = 4;
const LABEL_TEXT_MARGIN_RIGHT = 10;
const TOOLTIP_CLASSNAME = "tooltip-wrapper";

const StyledLabelTextWrapper = styled.div`
  align-items: center;
  display: flex;
  margin-bottom: ${LABEL_TEXT_WRAPPER_MARGIN_BOTTOM}px;

  & .${TOOLTIP_CLASSNAME} {
    line-height: 0;
  }
`;

const StyledLabelText = styled.p<StyledLabelTextProps>`
  margin-bottom: 0;
  margin-right: ${LABEL_TEXT_MARGIN_RIGHT}px;
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

type LabelStyles = {
  labelStyle?: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
};

export type FieldLabelProps = PropsWithChildren<{
  label: string;
  tooltip?: string;
  labelStyles?: LabelStyles;
}>;

function FieldLabel({
  children,
  label,
  labelStyles,
  tooltip,
}: FieldLabelProps) {
  const labelStyleProps = (() => {
    const { labelStyle, labelTextColor = "", labelTextSize = "PARAGRAPH" } =
      labelStyles || {};

    const st = labelStyle?.split(",");
    return {
      color: labelTextColor,
      fontSize: TEXT_SIZES[labelTextSize],
      fontWeight: st?.includes(FontStyleTypes.BOLD) ? "bold" : "normal",
      fontStyle: st?.includes(FontStyleTypes.ITALIC) ? "italic" : "",
      textDecoration: st?.includes(FontStyleTypes.UNDERLINE) ? "underline" : "",
    };
  })();

  return (
    <label>
      <StyledLabelTextWrapper>
        <StyledLabelText {...labelStyleProps}>{label}</StyledLabelText>
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
    </label>
  );
}

export default FieldLabel;
