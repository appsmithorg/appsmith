import React from "react";
import { Colors } from "constants/Colors";
import { Icon, IconSize } from "design-system";
import {
  CardLeftContent,
  CardRightContent,
  CardTextWrapper,
  IconBadge,
  StyledCard,
} from "./styles";
import { BillingDashboardCard } from "./types";

export function DashboardCard(props: BillingDashboardCard) {
  const { icon, subtitle, title, value } = props;
  return (
    <StyledCard>
      <CardLeftContent>
        <IconBadge>
          <Icon
            fillColor={Colors.CTA_PURPLE}
            name={icon}
            size={IconSize.XXXXL}
          />
        </IconBadge>
        <CardTextWrapper>
          {title}
          {subtitle}
        </CardTextWrapper>
      </CardLeftContent>
      {value && <CardRightContent>{value}</CardRightContent>}
    </StyledCard>
  );
}
