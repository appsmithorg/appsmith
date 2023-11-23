import React from "react";

interface StoryGrid {
  cols?: number | string;
  children: React.ReactNode;
  gap?: string;
}

export function StoryGrid(props: StoryGrid) {
  const { cols = 5, gap = "10px" } = props;

  return (
    <div
      style={{
        display: "grid",
        justifyContent: "center",
        gap: gap,
        gridTemplateColumns: `repeat(${cols} , 1fr)`,
        flexWrap: "wrap",
      }}
    >
      {props.children}
    </div>
  );
}
