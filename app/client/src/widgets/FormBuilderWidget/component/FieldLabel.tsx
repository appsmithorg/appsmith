import React, { PropsWithChildren } from "react";
import styled from "styled-components";
import { Position } from "@blueprintjs/core";

import Tooltip from "components/editorComponents/Tooltip";
import { Colors } from "constants/Colors";
import { ReactComponent as HelpIcon } from "assets/icons/control/help.svg";
import { IconWrapper } from "constants/IconConstants";

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

const StyledLabelText = styled.p`
  margin-bottom: 0;
  margin-right: ${LABEL_TEXT_MARGIN_RIGHT}px;
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

type FieldLabelProps = PropsWithChildren<{
  label: string;
  tooltip?: string;
}>;

function FieldLabel({ children, label, tooltip }: FieldLabelProps) {
  return (
    <label>
      <StyledLabelTextWrapper>
        <StyledLabelText>{label}</StyledLabelText>
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
