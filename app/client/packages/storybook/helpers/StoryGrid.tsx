import React from "react";

export function StoryGrid(props: any) {
  return (
    <div
      style={{
        display: "grid",
        justifyContent: "center",
        gap: "10px",
        gridTemplateColumns: "repeat(5 , 1fr)",
        flexWrap: "wrap",
      }}
    >
      {props.children}
    </div>
  );
}
