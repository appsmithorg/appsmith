import React from "react";
import { select, withKnobs } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { Position } from "@blueprintjs/core";
import TooltipComponent from "components/ads/Tooltip";
import { StoryWrapper } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";

export default {
  title: "Tooltip",
  component: TooltipComponent,
  decorators: [withKnobs, withDesign],
};

export function MenuStory() {
  return (
    <StoryWrapper>
      <div style={{ paddingTop: "50px", paddingLeft: "50px", width: "200px" }}>
        <TooltipComponent
          content={
            <Text highlight type={TextType.P1}>
              This is a tooltip
            </Text>
          }
          position={select("Position", Object.values(Position), Position.RIGHT)}
          variant={select("variant", ["dark", "light"], "dark")}
        >
          <Text highlight type={TextType.P1}>
            Hover to show tooltip
          </Text>
        </TooltipComponent>
      </div>
    </StoryWrapper>
  );
}
