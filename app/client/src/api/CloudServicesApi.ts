import { getAppsmithConfigs } from "configs";

const { cloudServicesBaseUrl: BASE_URL } = getAppsmithConfigs();

export const authorizeSaasWithAppsmithToken = (appsmithToken: string) =>
  `${BASE_URL}/api/v1/integrations/oauth/authorize?appsmithToken=${appsmithToken}`;
