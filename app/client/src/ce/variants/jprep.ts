import { EndpointGroups, EnvKeys, ConfigurationEnvKeys } from "./config";

const endpointProduction: EndpointGroups = {
  gRPC: "https://web-api.prod.jprep.manabie.io:31400",
  bobGraphQL: "https://admin.prod.jprep.manabie.io:31600",
  mastermgmtGraphQL: "https://admin.prod.jprep.manabie.io:31600/mastermgmt",
  eurekaGraphQL: "https://admin.prod.jprep.manabie.io:31600/eureka",
  fatimaGraphQL: "https://admin.prod.jprep.manabie.io:31600/fatima",
  invoicemgmtGraphQL: "https://admin.prod.jprep.manabie.io:31600/invoicemgmt",
  entryexitmgmtGraphQL:
    "https://admin.prod.jprep.manabie.io:31600/entryexitmgmt",
  timesheetGraphQL: "https://admin.prod.jprep.manabie.io:31600/timesheet",
  calendarGraphQL: "https://admin.prod.jprep.manabie.io:31600/calendar",
  OCR: "https://asia-east2-content-management-syste-c40d1.cloudfunctions.net",
  unleash: "https://admin.prod.jprep.manabie.io:31600/unleash",
  unleashKey:
    "ce4ed2eba3a72d6b5be23c7aa9b71178753f5908cf2dcbbca29442b5b81d397f",
  draft: "https://admin.prod.jprep.manabie.io:31600/draftv2",
  zeus: "https://admin.prod.jprep.manabie.io:31600/zeusv2",
  grpcTranscode: "https://api.prod.jprep.manabie.io:31400",
};

const endpointUAT: EndpointGroups = {
  gRPC: "https://web-api.uat.jprep.manabie.io",
  bobGraphQL: "https://admin.uat.jprep.manabie.io",
  mastermgmtGraphQL: "https://admin.uat.jprep.manabie.io/mastermgmt",
  eurekaGraphQL: "https://admin.uat.jprep.manabie.io/eureka",
  fatimaGraphQL: "https://admin.uat.jprep.manabie.io/fatima",
  invoicemgmtGraphQL: "https://admin.uat.jprep.manabie.io/invoicemgmt",
  entryexitmgmtGraphQL: "https://admin.uat.jprep.manabie.io/entryexitmgmt",
  timesheetGraphQL: "https://admin.uat.jprep.manabie.io/timesheet",
  calendarGraphQL: "https://admin.uat.jprep.manabie.io/calendar",
  OCR: "https://asia-east2-content-management-syste-c40d1.cloudfunctions.net",
  unleash: "https://admin.uat.jprep.manabie.io/unleash",
  unleashKey:
    "ce4ed2eba3a72d6b5be23c7aa9b71178753f5908cf2dcbbca29442b5b81d397f",
  draft: "https://admin.uat.jprep.manabie.io/draftv2",
  zeus: "https://admin.uat.jprep.manabie.io/zeusv2",
  grpcTranscode: "https://api.uat.jprep.manabie.io",
};

const endpointStaging: EndpointGroups = {
  gRPC: "https://web-api.staging.jprep.manabie.io:31400",
  bobGraphQL: "https://admin.staging.jprep.manabie.io:31600",
  mastermgmtGraphQL: "https://admin.staging.jprep.manabie.io:31600/mastermgmt",
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
  unleashKey:
    "ce4ed2eba3a72d6b5be23c7aa9b71178753f5908cf2dcbbca29442b5b81d397f",
  draft: "https://admin.staging.jprep.manabie.io:31600/draftv2",
  zeus: "https://admin.staging.jprep.manabie.io:31600/zeusv2",
  grpcTranscode: "https://api.staging.jprep.manabie.io:31400",
};

const configs: ConfigurationEnvKeys = {
  [EnvKeys.STAGING]: endpointStaging,
  [EnvKeys.UAT]: endpointUAT,
  [EnvKeys.PRODUCTION]: endpointProduction,
};

export default configs;
