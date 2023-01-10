import { IconProps, Text } from "design-system";
import { ReactComponentElement } from "react";

export type Header = {
  title: string;
  subtitle: string;
};

export type BillingDashboardCard = {
  title: ReactComponentElement<typeof Text>;
  subtitle: ReactComponentElement<typeof Text>;
  icon: string;
  value?: ReactComponentElement<typeof Text>;
};

export type CTATextType = {
  action?: () => void;
  text: string;
  icon?: IconProps;
};

export type HeaderProps = Header;
export type BillingDashboardProps = { cards: BillingDashboardCard[] };
export type CTATextProps = CTATextType;
