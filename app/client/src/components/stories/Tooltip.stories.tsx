import React from "react";
import { withDesign } from "storybook-addon-designs";
import { Position } from "@blueprintjs/core";
import TooltipComponent, { TooltipProps } from "components/ads/Tooltip";
import { StoryWrapper, Variant } from "components/ads/common";
import Button, { Size } from "components/ads/Button";
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
      <TooltipComponent {...args} onOpening={action("tooltip-opened")}>
        <Button
          size={Size.large}
          tag={"button"}
          text="Hover to show tooltip"
          variant={Variant.info}
        />
      </TooltipComponent>
    </StoryWrapper>
  );
}

TooltipStory.args = {
  content: "I'm a hover over text.",
  position: Position.BOTTOM,
  // isOpen: true,
};

TooltipStory.argTypes = {};

TooltipStory.storyName = storyName.platform.tooltip.NAME;
