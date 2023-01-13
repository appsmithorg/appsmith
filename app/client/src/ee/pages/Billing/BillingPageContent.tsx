import React from "react";
import { PageContent } from "./styles";
import { DashboardCard } from "./DashboardCard";
import { BillingDashboardProps } from "./types";

export function BillingPageContent(props: BillingDashboardProps) {
  const { cards } = props;

  return (
    <PageContent>
      {cards?.map((card, index: number) => {
        return <DashboardCard key={index} {...card} />;
      })}
    </PageContent>
  );
}
