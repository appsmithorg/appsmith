export const authorizeDatasourceWithAppsmithToken = (appsmithToken: string) =>
  `/api/v1/saas/authorize?appsmithToken=${appsmithToken}`;
