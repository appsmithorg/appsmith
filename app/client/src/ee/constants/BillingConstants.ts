import { getAppsmithConfigs } from "@appsmith/configs";

const appsmithConfigs = getAppsmithConfigs();

export const CUSTOMER_PORTAL_PLANS_URL = `${appsmithConfigs.customerPortalUrl}/plans`;
