import React from "react";
import type { ComponentProps } from "react";

// Adapted from remixicon-react/SubtractLineIcon (https://github.com/Remix-Design/RemixIcon/blob/f88a51b6402562c6c2465f61a3e845115992e4c6/icons/System/subtract-line.svg)
export const SubtractIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg
      className="icon icon-tabler icon-tabler-minus"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M0 0h24v24H0z" fill="none" stroke="none" />
      <path d="M5 12l14 0" />
    </svg>
  );
};
