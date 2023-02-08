import { openInNewTab } from "@appsmith/utils";

//TODO : Update to customer.appsmith.com when going live
export const CUSTOMER_PORTAL_URL =
  "https://release-customer.appsmith.com/plans";

export const goToCustomerPortal = () => {
  openInNewTab(CUSTOMER_PORTAL_URL);
};
