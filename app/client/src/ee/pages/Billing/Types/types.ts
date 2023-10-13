import type { IconProps, Text } from "design-system";
import type { ReactComponentElement, ReactNode } from "react";

export interface Header {
  title: string;
  subtitle?: string;
}

export interface BillingDashboardCard {
  title: ReactComponentElement<typeof Text>;
  subtitle?: ReactComponentElement<typeof Text>;
  content?: ReactNode;
  icon: string;
  action?: ReactNode;
  name: string;
}

export interface CustomerPortalLink {
  action?: string;
  text: string;
  icon?: IconProps;
  label?: string;
}

export type HeaderProps = Header;
export interface BillingDashboardProps {
  cards: BillingDashboardCard[];
}

export enum LICENSE_TYPE {
  TRIAL = "TRIAL",
  PAID = "PAID",
  PAYMENT_FAILED = "IN_GRACE_PERIOD",
  EXPIRED = "EXPIRED",
}

export interface BillingField {
  label: string;
  value: string;
  selector: string;
}

export enum LICENSE_PLANS {
  FREE = "FREE",
  PAID = "PAID",
}

export enum LICENSE_MODIFICATION {
  UPGRADE = "UPGRADE",
  DOWNGRADE = "DOWNGRADE",
}

export enum PRODUCT_EDITION {
  COMMERCIAL = "COMMERCIAL",
  AIR_GAP = "AIR_GAP",
}

export enum LICENSE_PLAN {
  BUSINESS = "BUSINESS",
  ENTERPRISE = "ENTERPRISE",
}
