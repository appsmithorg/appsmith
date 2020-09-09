import React from "react";
import { select, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { Position } from "@blueprintjs/core";
import TooltipComponent from "components/ads/Tooltip";
import { StoryWrapper } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import Button from "components/ads/Button";

export default {
  title: "Tooltip",
  component: TooltipComponent,
  decorators: [withKnobs, withDesign],
};

export const MenuStory = () => (
  <StoryWrapper>
    <div style={{ paddingTop: "50px", paddingLeft: "50px", width: "200px" }}>
      <TooltipComponent
        position={select("Position", Object.values(Position), Position.RIGHT)}
        content={
          <Text type={TextType.P1} highlight>
            This is a tooltip
          </Text>
        }
        variant={select("variant", ["dark", "light"], "dark")}
      >
        <Text type={TextType.P1} highlight>
          Hover to show tooltip
        </Text>
      </TooltipComponent>
    </div>
  </StoryWrapper>
);
