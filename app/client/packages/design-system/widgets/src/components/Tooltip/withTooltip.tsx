import React from "react";

import { Tooltip, TooltipTrigger, TooltipContent } from "./";

type WithTooltip = {
  tooltip?: string;
};

/**
 * HOC that adds a tooltip to a component
 * e.g - const ButtonWithTooltip = withTooltip(Button);
 *
 * @param WrappedComponent
 * @returns
 */
export function withTooltip<T extends WithTooltip = WithTooltip>(
  WrappedComponent: React.ComponentType<T>,
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  const ComponentWithTooltip = (props: T) => {
    const { tooltip, ...rest } = props;

    // if no tooltip passed, just render the component
    if (!tooltip) return <WrappedComponent {...(rest as T)} />;

    return (
      <Tooltip>
        <TooltipTrigger>
          <WrappedComponent {...(rest as T)} />
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  };

  ComponentWithTooltip.displayName = `withTooltip(${displayName})`;

  return ComponentWithTooltip;
}
