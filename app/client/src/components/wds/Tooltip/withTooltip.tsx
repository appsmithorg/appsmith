import React from "react";
import styled from "styled-components";
import { TooltipComponent as Tooltip } from "design-system";

const ToolTipWrapper = styled.div`
  height: 100%;
  && .bp3-popover2-target {
    height: 100%;
    width: 100%;
    & > div {
      height: 100%;
    }
  }
`;

interface TooltipProps {
  tooltip?: string;
  isDisabled?: boolean;
}

export default function withTooltip<T extends TooltipProps = TooltipProps>(
  WrappedComponent: React.ComponentType<T>,
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  function ComponentWithTooltip(props: T) {
    if (props.tooltip) {
      return (
        <ToolTipWrapper>
          <Tooltip
            content={props.tooltip}
            disabled={props.isDisabled}
            hoverOpenDelay={200}
            position="top"
          >
            <WrappedComponent {...props} {...(props as T)} />
          </Tooltip>
        </ToolTipWrapper>
      );
    }

    return <WrappedComponent {...props} {...(props as T)} />;
  }

  ComponentWithTooltip.displayName = `withTooltip(${displayName})`;

  return ComponentWithTooltip;
}
