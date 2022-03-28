import { getAppsmithConfigs } from "@appsmith/configs";

const { cloudServicesBaseUrl: BASE_URL } = getAppsmithConfigs();

export const authorizeDatasourceWithAppsmithToken = (appsmithToken: string) =>
  `${BASE_URL}/api/v1/integrations/oauth/authorize?appsmithToken=${appsmithToken}`;
