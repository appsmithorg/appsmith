import React from "react";

import type { InlineInputProps as HeadlessInlineInputProps } from "@design-system/headless";

import { StyledInlineInput } from "./index.styled";

export type InlineInputProps = {
  labelPosition: "left" | "right";
} & HeadlessInlineInputProps;

export const InlineInput = (props: InlineInputProps) => {
  return <StyledInlineInput {...props} />;
};
