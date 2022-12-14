import { EndpointGroups, EnvKeys, ConfigurationEnvKeys } from "./config";

const endpointProduction: EndpointGroups = {
  gRPC: "https://web-api.prod.jprep.manabie.io:31400",
  bobGraphQL: "https://admin.prod.jprep.manabie.io:31600",
  eurekaGraphQL: "https://admin.prod.jprep.manabie.io:31600/eureka",
  fatimaGraphQL: "https://admin.prod.jprep.manabie.io:31600/fatima",
  invoicemgmtGraphQL: "https://admin.prod.jprep.manabie.io:31600/invoicemgmt",
  entryexitmgmtGraphQL:
    "https://admin.prod.jprep.manabie.io:31600/entryexitmgmt",
  timesheetGraphQL: "https://admin.prod.jprep.manabie.io:31600/timesheet",
  calendarGraphQL: "https://admin.prod.jprep.manabie.io:31600/calendar",
  OCR: "https://asia-east2-content-management-syste-c40d1.cloudfunctions.net",
  unleash: "https://admin.prod.jprep.manabie.io:31600/unleash",
};

const endpointUAT: EndpointGroups = {
  gRPC: "https://web-api.uat.jprep.manabie.io",
  bobGraphQL: "https://admin.uat.jprep.manabie.io",
  eurekaGraphQL: "https://admin.uat.jprep.manabie.io/eureka",
  fatimaGraphQL: "https://admin.uat.jprep.manabie.io/fatima",
  invoicemgmtGraphQL: "https://admin.uat.jprep.manabie.io/invoicemgmt",
  entryexitmgmtGraphQL: "https://admin.uat.jprep.manabie.io/entryexitmgmt",
  timesheetGraphQL: "https://admin.uat.jprep.manabie.io/timesheet",
  calendarGraphQL: "https://admin.uat.jprep.manabie.io/calendar",
  OCR: "https://asia-east2-content-management-syste-c40d1.cloudfunctions.net",
  unleash: "https://admin.uat.jprep.manabie.io/unleash",
};

const endpointStaging: EndpointGroups = {
  gRPC: "https://web-api.staging.jprep.manabie.io:31400",
  bobGraphQL: "https://admin.staging.jprep.manabie.io:31600",
  eurekaGraphQL: "https://admin.staging.jprep.manabie.io:31600/eureka",
  fatimaGraphQL: "https://admin.staging.jprep.manabie.io:31600/fatima",
  invoicemgmtGraphQL:
    "https://admin.staging.jprep.manabie.io:31600/invoicemgmt",
  entryexitmgmtGraphQL:
    "https://admin.staging.jprep.manabie.io:31600/entryexitmgmt",
  timesheetGraphQL: "https://admin.staging.jprep.manabie.io:31600/timesheet",
  calendarGraphQL: "https://admin.staging.jprep.manabie.io:31600/calendar",
  OCR: "https://asia-east2-content-management-syste-c40d1.cloudfunctions.net",
  unleash: "https://admin.staging.jprep.manabie.io/unleash",
};

const configs: ConfigurationEnvKeys = {
  [EnvKeys.STAGING]: endpointStaging,
  [EnvKeys.UAT]: endpointUAT,
  [EnvKeys.PRODUCTION]: endpointProduction,
};

export default configs;
