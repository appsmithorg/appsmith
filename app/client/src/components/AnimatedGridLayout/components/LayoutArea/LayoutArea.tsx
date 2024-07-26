import React from "react";
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
        display,
      }}
    >
      {children}
    </div>
  );
}
