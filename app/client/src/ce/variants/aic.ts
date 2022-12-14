import { EndpointGroups, EnvKeys, ConfigurationEnvKeys } from "./config";

const endpointProduction: EndpointGroups = {
  gRPC: "https://web-api.prod.aic.manabie.io:31400",
  bobGraphQL: "https://admin.prod.aic.manabie.io:31600",
  eurekaGraphQL: "https://admin.prod.aic.manabie.io:31600/eureka",
  fatimaGraphQL: "https://admin.prod.aic.manabie.io:31600/fatima",
  invoicemgmtGraphQL: "https://admin.prod.aic.manabie.io:31600/invoicemgmt",
  entryexitmgmtGraphQL: "https://admin.prod.aic.manabie.io:31600/entryexitmgmt",
  timesheetGraphQL: "https://admin.prod.aic.manabie.io:31600/timesheet",
  calendarGraphQL: "https://admin.prod.aic.manabie.io:31600/calendar",
  OCR: "https://asia-east2-content-management-syste-c40d1.cloudfunctions.net",
  unleash: "https://admin.prod.aic.manabie.io:31600/unleash",
};

const endpointUAT: EndpointGroups = {
  gRPC: "https://web-api.uat.manabie.io",
  bobGraphQL: "https://admin.uat.manabie.io",
  eurekaGraphQL: "https://admin.uat.manabie.io/eureka",
  fatimaGraphQL: "https://admin.uat.manabie.io/fatima",
  invoicemgmtGraphQL: "https://admin.uat.manabie.io/invoicemgmt",
  entryexitmgmtGraphQL: "https://admin.uat.manabie.io/entryexitmgmt",
  timesheetGraphQL: "https://admin.uat.manabie.io/timesheet",
  calendarGraphQL: "https://admin.uat.manabie.io/calendar",
  OCR: "https://asia-east2-content-management-syste-c40d1.cloudfunctions.net",
  unleash: "https://admin.uat.manabie.io/unleash",
};

const endpointStaging: EndpointGroups = {
  gRPC: "https://web-api.staging-green.manabie.io",
  bobGraphQL: "https://admin.staging-green.manabie.io",
  eurekaGraphQL: "https://admin.staging-green.manabie.io/eureka",
  fatimaGraphQL: "https://admin.staging-green.manabie.io/fatima",
  invoicemgmtGraphQL: "https://admin.staging-green.manabie.io/invoicemgmt",
  entryexitmgmtGraphQL: "https://admin.staging-green.manabie.io/entryexitmgmt",
  timesheetGraphQL: "https://admin.staging-green.manabie.io/timesheet",
  calendarGraphQL: "https://admin.staging-green.manabie.io/calendar",
  OCR: "https://asia-east2-content-management-syste-c40d1.cloudfunctions.net",
  unleash: "https://admin.staging.manabie.io/unleash",
};

const configs: ConfigurationEnvKeys = {
  [EnvKeys.STAGING]: endpointStaging,
  [EnvKeys.UAT]: endpointUAT,
  [EnvKeys.PRODUCTION]: endpointProduction,
};

export default configs;
