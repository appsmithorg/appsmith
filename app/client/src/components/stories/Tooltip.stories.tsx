import React from "react";
import { withDesign } from "storybook-addon-designs";
import { Position } from "@blueprintjs/core";
import TooltipComponent, { TooltipProps } from "components/ads/Tooltip";
import { StoryWrapper, Variant } from "components/ads/common";
import Button from "components/ads/Button";
import { storyName } from "./config/constants";
import { statusType } from "./config/types";
import { action } from "@storybook/addon-actions";

export default {
  title: storyName.platform.tooltip.PATH,
  component: TooltipComponent,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.BETA,
    },
  },
};

export function TooltipStory(args: TooltipProps) {
  return (
    <StoryWrapper style={{ height: 350 }}>
      <div id="tooltip-root" />
      <TooltipComponent {...args} onOpening={action("tooltip-opened")}>
        <Button text="Hover to show tooltip" variant={Variant.info} />
      </TooltipComponent>
    </StoryWrapper>
  );
}

TooltipStory.args = {
  content: "I'm a hover over text.",
  position: Position.RIGHT,
  boundary: "viewport",
  // minWidth: "250px",
  // openOnTargetFocus: true,
  // autoFocus: true,
  // hoverOpenDelay: 500,
  // minimal: false,
  // isOpen: false,
  // modifiers: { preventOverflow: { enabled: true } },
};

TooltipStory.argTypes = {};

TooltipStory.storyName = storyName.platform.tooltip.NAME;
