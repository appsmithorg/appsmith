import React from "react";
import { Colors } from "constants/Colors";
import { Icon, IconSize } from "design-system-old";
import {
  CardLeftContent,
  CardRightContent,
  CardTextWrapper,
  IconBadge,
  StyledCard,
} from "./styles";
import type { BillingDashboardCard } from "./types";

export function DashboardCard(props: BillingDashboardCard) {
  const { action, content, icon, subtitle, title } = props;
  return (
    <StyledCard data-testid="t--dashboard-card">
      <CardLeftContent data-testid="t--dashboard-card-left-content">
        <IconBadge>
          <Icon fillColor={Colors.SCORPION} name={icon} size={IconSize.XXXXL} />
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
