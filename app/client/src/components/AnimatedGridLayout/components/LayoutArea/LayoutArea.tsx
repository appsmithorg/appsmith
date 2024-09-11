import React from "react";
import { animated, useSpring } from "react-spring";
import { SPRING_CONFIG } from "./constants";
import { SPRING_ANIMATION_CONFIG } from "../../constants";

interface AreaDimensions {
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
}
export interface LayoutAreaProps {
  /** CSS grid area name. */
  name: string;
  /** Controls visibility, used for fade animation. */
  hidden?: boolean;
  /** The content of the layout area. */
  children: React.ReactNode;
  /** Used to set min-width to smooth container size transitions.  */
  dimensions?: AreaDimensions;
}

export function LayoutArea(props: LayoutAreaProps) {
  const { children, dimensions, hidden = false, name } = props;
  const display = hidden ? "none" : "block";
  const springs = useSpring({
    config: SPRING_ANIMATION_CONFIG,
    ...SPRING_CONFIG[display],
  });

  return (
    <animated.div
      style={{
        gridArea: name,
        position: "relative",
        animationFillMode: "forwards",
        willChange: "auto",
        overflow: "hidden",
        ...springs,
      }}
    >
      <div
        style={{
          width: dimensions?.width || "100%",
          height: "100%",
          position: "absolute",
          overflow: "auto",
        }}
      >
        {children}
      </div>
    </animated.div>
  );
}
