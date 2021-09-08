import React from "react";
import { withDesign } from "storybook-addon-designs";
import { Position } from "@blueprintjs/core";
import TooltipComponent, { TooltipProps } from "components/ads/Tooltip";
import { Variant } from "components/ads/common";
import Button, { Size } from "components/ads/Button";
import { storyName } from "./config/constants";
import { statusType } from "./config/types";
import { action } from "@storybook/addon-actions";
import styled from "styled-components";

export default {
  title: storyName.platform.tooltip.PATH,
  component: TooltipComponent,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

const TooltipWrapper = styled.div`
  background: #ffffff;
  height: 250px;
  margin: auto;
  .bp3-popover-target {
    width: fit-content;
    margin: auto;
    margin-top: 50px;
  }
`;

export function TooltipStory(args: TooltipProps) {
  return (
    <TooltipWrapper>
      <TooltipComponent {...args} onOpening={action("tooltip-opened")}>
        <Button
          size={Size.large}
          tag={"button"}
          text="Hover to show tooltip"
          variant={Variant.info}
        />
      </TooltipComponent>
    </TooltipWrapper>
  );
}

TooltipStory.args = {
  content: "I'm a hover over text.",
  position: Position.BOTTOM,
  isOpen: undefined,
  disabled: false,
  variant: Variant.info,
  maxWidth: "250px",
  boundary: "scrollParent",
  minWidth: "200px",
  openOnTargetFocus: false,
  autoFocus: false,
  hoverOpenDelay: 100,
  minimal: false,
};

TooltipStory.argTypes = {};

TooltipStory.storyName = storyName.platform.tooltip.NAME;
