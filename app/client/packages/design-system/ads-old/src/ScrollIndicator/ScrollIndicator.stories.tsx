import React, { useRef } from "react";
import type { ComponentMeta } from "@storybook/react";

import ScrollIndicatorComponent from "./index";

export default {
  title: "Design System/ScrollIndicator",
  component: ScrollIndicatorComponent,
} as ComponentMeta<typeof ScrollIndicatorComponent>;

// eslint-disable-next-line react/function-component-definition
export const ScrollIndicator = () => {
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
      <ScrollIndicatorComponent
        alwaysShowScrollbar
        containerRef={containerRef}
        mode="DARK"
        right="0"
        top="0"
      />
    </div>
  );
};
