import { IconProps, Text } from "design-system-old";
import { ReactComponentElement, ReactNode } from "react";

export type Header = {
  title: string;
  subtitle: string;
};

export type BillingDashboardCard = {
  title: ReactComponentElement<typeof Text>;
  subtitle: ReactComponentElement<typeof Text>;
  content?: ReactNode;
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
