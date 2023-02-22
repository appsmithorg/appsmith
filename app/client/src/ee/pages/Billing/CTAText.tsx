import { Button } from "design-system-old";
import React from "react";
import { CTAButtonProps } from "./types";

export function CtaText(props: CTAButtonProps) {
  const { action, text, ...rest } = props;
  return <Button onClick={action} text={text} {...rest} />;
}
