import React from "react";
import { Resizable } from "re-resizable";

export const resizor = (Story, args) => {
  const { parameters } = args;

  return (
    <Resizable
      enable={parameters.enableResizing}
      grid={[8, 8]}
      defaultSize={{
        width: parameters.width,
        height: parameters.height,
      }}
    >
      <Story />
    </Resizable>
  );
};
