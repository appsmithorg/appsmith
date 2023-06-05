import React from "react";
import {
  CardLeftContent,
  CardRightContent,
  CardTextWrapper,
  IconBadge,
  StyledCard,
} from "./styles";
import type { BillingDashboardCard } from "./types";
import { Icon } from "design-system";

export function DashboardCard(props: BillingDashboardCard) {
  const { action, content, icon, subtitle, title } = props;
  return (
    <StyledCard data-testid="t--dashboard-card">
      <CardLeftContent data-testid="t--dashboard-card-left-content">
        <IconBadge>
          <Icon name={icon} size="lg" />
        </IconBadge>
        <CardTextWrapper>
          {title}
          {content}
          {subtitle}
        </CardTextWrapper>
      </CardLeftContent>
      {action && (
        <CardRightContent data-testid="t--dashboard-card-right-content">
          {action}
        </CardRightContent>
      )}
    </StyledCard>
  );
}
