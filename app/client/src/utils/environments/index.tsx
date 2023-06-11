import type { Datasource } from "entities/Datasource";

export const isEnvironmentConfigured = (
  datasource: Datasource | null,
  environment: string,
) => {
  return (
    datasource &&
    datasource.datasourceStorages &&
    datasource.datasourceStorages[environment]?.isConfigured
  );
};
