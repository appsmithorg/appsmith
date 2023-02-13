import { Icon, Text, TextType } from "design-system-old";
import React from "react";
import { CTATextWrapper } from "./styles";
import { CTATextProps } from "./types";

export function CtaText(props: CTATextProps) {
  const { action, icon, text } = props;
  return (
    <CTATextWrapper onClick={action}>
      <Text as={"button"} className="cta-text" type={TextType.P2} weight="600">
        {text}
      </Text>
      {icon && <Icon {...icon} className="cta-icon" />}
    </CTATextWrapper>
  );
}
