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
import { BillingDashboardCard } from "./types";

export function DashboardCard(props: BillingDashboardCard) {
  const { action, content, icon, subtitle, title } = props;
  return (
    <StyledCard>
      <CardLeftContent>
        <IconBadge>
          <Icon fillColor={Colors.SCORPION} name={icon} size={IconSize.XXXXL} />
        </IconBadge>
        <CardTextWrapper>
          {title}
          {content}
          {subtitle}
        </CardTextWrapper>
      </CardLeftContent>
      {action && <CardRightContent>{action}</CardRightContent>}
    </StyledCard>
  );
}
