import type { ButtonProps, IconProps, Text } from "design-system-old";
import type { ReactComponentElement, ReactNode } from "react";

export type Header = {
  title: string;
  subtitle?: string;
};

export type BillingDashboardCard = {
  title: ReactComponentElement<typeof Text>;
  subtitle?: ReactComponentElement<typeof Text>;
  content?: ReactNode;
  icon: string;
  action?: ReactNode;
  name: string;
};

export type CTAButtonType = {
  action?: () => void;
  text: string;
  icon?: IconProps;
};

export type HeaderProps = Header;
export type BillingDashboardProps = { cards: BillingDashboardCard[] };
export type CTAButtonProps = CTAButtonType & ButtonProps;

export enum LICENSE_ORIGIN {
  SELF_SERVE = "SELF_SERVE",
  ENTERPRISE = "ENTERPRISE",
}

export enum LICENSE_TYPE {
  TRIAL = "TRIAL",
  PAID = "PAID",
  PAYMENT_FAILED = "IN_GRACE_PERIOD",
}
