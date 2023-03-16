import React from "react";
import { Text, TextType } from "design-system-old";
import type { HeaderProps } from "./types";
import { PageHeader } from "./styles";

export function BillingPageHeader(props: HeaderProps) {
  const { subtitle, title } = props;
  return (
    <PageHeader data-testid="t--billing-header">
      <Text className="header-text" type={TextType.H1} weight="600">
        {title}
      </Text>
      {subtitle && (
        <Text className="sub-header-text" type={TextType.P2}>
          {subtitle}
        </Text>
      )}
    </PageHeader>
  );
}
