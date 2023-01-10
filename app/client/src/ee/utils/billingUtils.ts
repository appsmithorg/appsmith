import { openInNewTab } from "@appsmith/utils";

export const CUSTOMER_PORTAL_URL = "https://customer.appsmith.com/signin";

export const goToCustomerPortal = () => {
  openInNewTab(CUSTOMER_PORTAL_URL);
};
