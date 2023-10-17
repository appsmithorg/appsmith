import { getAppsmithConfigs } from "@appsmith/configs";

const appsmithConfigs = getAppsmithConfigs();

export const CUSTOMER_PORTAL_PLANS_URL = `${appsmithConfigs.customerPortalUrl}/plans`;

export const DOWNGRADE_DOC =
  "https://docs.appsmith.com/getting-started/setup/manage-plans/downgrade-plan";

export const SALES_TEAM_EMAIL = `sales@appsmith.com`;
