import React from "react";
import { DISPLAY_CONFIG } from "./constants";
export interface LayoutAreaProps {
  name: string;
  hidden?: boolean;
  children: React.ReactNode;
}

export function LayoutArea(props: LayoutAreaProps) {
  const { children, hidden = false, name } = props;
  const display = hidden ? "none" : "block";

  return (
    <div
      style={{
        gridArea: name,
        position: "relative",
        ...DISPLAY_CONFIG[display],
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
    </div>
  );
}
