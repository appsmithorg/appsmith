import React from "react";

export const resizor = (Story, args) => {
  const { parameters } = args;

  return (
    <div
      style={{
        width: parameters.width,
        height: parameters.height,
      }}
    >
      <Story />
    </div>
  );
};
