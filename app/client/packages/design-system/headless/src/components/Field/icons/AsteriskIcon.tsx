import React from "react";

// Adapted from remixicon-react/AsteriskIcon (https://github.com/Remix-Design/RemixIcon/blob/f88a51b6402562c6c2465f61a3e845115992e4c6/icons/Editor/asterisk.svg)
export const AsteriskIcon = (props: { [key: string]: string | undefined }) => {
  return (
    <svg
      fill="currentColor"
      height={24}
      viewBox="0 0 24 24"
      width={24}
      {...props}
    >
      <path d="M13 3v7.267l6.294-3.633 1 1.732L14 11.999l6.294 3.635-1 1.732-6.295-3.634V21h-2v-7.268l-6.294 3.634-1-1.732L9.998 12 3.705 8.366l1-1.732L11 10.267V3h2Z" />
    </svg>
  );
};
