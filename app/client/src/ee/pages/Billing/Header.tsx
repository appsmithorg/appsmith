import React from "react";
import type { HeaderProps } from "./types";
import { PageHeader } from "./styles";
import { Text } from "design-system";

export function BillingPageHeader(props: HeaderProps) {
  const { subtitle, title } = props;
  return (
    <PageHeader data-testid="t--billing-header">
      <Text
        className="header-text"
        color="var(--ads-v2-color-fg-emphasis-plus)"
        kind="heading-l"
        renderAs="h1"
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          className="sub-header-text"
          color="var(--ads-v2-color-fg-emphasis)"
          kind="body-m"
          renderAs="h2"
        >
          {subtitle}
        </Text>
      )}
    </PageHeader>
  );
}
