import * as React from "react";
import { useRef } from "react";
import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { ScrollIndicator } from "@design-system/widgets-old";

export default {
  title: "Design System/Widgets-old/Scroll Indicator",
  component: ScrollIndicator,
} as ComponentMeta<typeof ScrollIndicator>;

const Template: ComponentStory<typeof ScrollIndicator> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={containerRef}
      style={{
        height: "400px",
        width: "40vw",
        backgroundColor: "#8a8383c4",
        overflow: "scroll",
      }}
    >
      <div style={{ height: "800px" }} />
      <ScrollIndicator
        alwaysShowScrollbar
        containerRef={containerRef}
        mode="DARK"
        right="0"
        top="0"
      />
    </div>
  );
};

export const ScrollIndicatorStory = Template.bind({});
ScrollIndicatorStory.storyName = "Scroll Indicator";
