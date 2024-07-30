import React from "react";
import { animated, useSpring } from "react-spring";
import { SPRING_CONFIG } from "./constants";
import { SPRING_ANIMATION_CONFIG } from "../../constants";

export interface LayoutAreaProps {
  name: string;
  hidden?: boolean;
  children: React.ReactNode;
}

export function LayoutArea(props: LayoutAreaProps) {
  const { children, hidden = false, name } = props;
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
        ...springs,
      }}
    >
      <div
        style={{
          width: "100%",
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
