import React from "react";
import type { ComponentProps } from "react";

// Adapted from remixicon-react/SubtractLineIcon (https://github.com/Remix-Design/RemixIcon/blob/f88a51b6402562c6c2465f61a3e845115992e4c6/icons/System/subtract-line.svg)
export const SubtractIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M5 11V13H19V11H5Z" />
    </svg>
  );
};
