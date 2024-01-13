import React from "react";
import type { ComponentProps } from "react";

// Adapted from remixicon-react/closeFill (https://github.com/Remix-Design/RemixIcon/blob/f88a51b6402562c6c2465f61a3e845115992e4c6/icons/System/close-fill.svg)
export const CloseIcon = (props: ComponentProps<"svg">) => {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M12.0007 10.5865L16.9504 5.63672L18.3646 7.05093L13.4149 12.0007L18.3646 16.9504L16.9504 18.3646L12.0007 13.4149L7.05093 18.3646L5.63672 16.9504L10.5865 12.0007L5.63672 7.05093L7.05093 5.63672L12.0007 10.5865Z" />
    </svg>
  );
};
