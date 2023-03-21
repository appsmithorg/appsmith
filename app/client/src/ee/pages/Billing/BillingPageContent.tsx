import React from "react";
import { PageContent } from "./styles";
import { DashboardCard } from "./DashboardCard";
import type { BillingDashboardProps } from "./types";

export function BillingPageContent(props: BillingDashboardProps) {
  const { cards } = props;

  return (
    <PageContent data-testid="t--billing-page-content">
      {cards?.map((card, index: number) => {
        return <DashboardCard key={index} {...card} />;
      })}
    </PageContent>
  );
}
