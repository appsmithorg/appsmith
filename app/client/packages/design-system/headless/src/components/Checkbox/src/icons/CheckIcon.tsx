import React from "react";
import type { ComponentProps } from "react";

export const CheckIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="m10 15.17 9.193-9.191 1.414 1.414-10.606 10.606-6.364-6.364 1.414-1.414 4.95 4.95Z" />
    </svg>
  );
};
