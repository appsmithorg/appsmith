import React from "react";
import { Tooltip } from "@blueprintjs/core";
import { TooltipContentWrapper } from "../TableStyledWrappers";

interface ConditionalTooltipProps {
  disabledState: boolean;
  toolTipTitle: string;
  renderComponent: any;
}
const ConditionalTooltipRenderer = (props: ConditionalTooltipProps) => {
  const { disabledState, renderComponent, toolTipTitle } = props;
  return disabledState ? (
    <Tooltip
      autoFocus={false}
      content={<TooltipContentWrapper>{toolTipTitle}</TooltipContentWrapper>}
      hoverOpenDelay={200}
      position="top"
    >
      {renderComponent({ props })}
    </Tooltip>
  ) : (
    renderComponent({ props })
  );
};

export default ConditionalTooltipRenderer;
