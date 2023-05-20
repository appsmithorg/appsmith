import { Button } from "design-system";
import React from "react";
import type { CTAButtonProps } from "./types";

export function CtaText(props: CTAButtonProps) {
  const { action, text, ...rest } = props;
  return (
    <Button onClick={() => action} {...rest}>
      {text}
    </Button>
  );
}
