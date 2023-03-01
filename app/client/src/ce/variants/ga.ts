import { EndpointGroups, EnvKeys, ConfigurationEnvKeys } from "./config";

const endpointProduction: EndpointGroups = {
  gRPC: "https://web-api.prod.ga.manabie.io:31400",
  bobGraphQL: "https://admin.prod.ga.manabie.io:31600",
  mastermgmtGraphQL: "https://admin.prod.ga.manabie.io:31600/mastermgmt",
  eurekaGraphQL: "https://admin.prod.ga.manabie.io:31600/eureka",
  fatimaGraphQL: "https://admin.prod.ga.manabie.io:31600/fatima",
  invoicemgmtGraphQL: "https://admin.prod.ga.manabie.io:31600/invoicemgmt",
  entryexitmgmtGraphQL: "https://admin.prod.ga.manabie.io:31600/entryexitmgmt",
  timesheetGraphQL: "https://admin.prod.ga.manabie.io:31600/timesheet",
  calendarGraphQL: "https://admin.prod.ga.manabie.io:31600/calendar",
  OCR: "https://asia-east2-content-management-syste-c40d1.cloudfunctions.net",
  unleash: "https://admin.prod.ga.manabie.io:31600/unleash",
  unleashKey:
    "ce4ed2eba3a72d6b5be23c7aa9b71178753f5908cf2dcbbca29442b5b81d397f",
  draft: "https://admin.prod.ga.manabie.io:31600/draftv2",
  zeus: "https://admin.prod.ga.manabie.io:31600/zeusv2",
  grpcTranscode: "https://api.prod.ga.manabie.io:31400",
};

const endpointUAT: EndpointGroups = {
  gRPC: "https://web-api.uat.manabie.io",
  bobGraphQL: "https://admin.uat.manabie.io",
  mastermgmtGraphQL: "https://admin.uat.manabie.io/mastermgmt",
  eurekaGraphQL: "https://admin.uat.manabie.io/eureka",
  fatimaGraphQL: "https://admin.uat.manabie.io/fatima",
  invoicemgmtGraphQL: "https://admin.uat.manabie.io/invoicemgmt",
  entryexitmgmtGraphQL: "https://admin.uat.manabie.io/entryexitmgmt",
  timesheetGraphQL: "https://admin.uat.manabie.io/timesheet",
  calendarGraphQL: "https://admin.uat.manabie.io/calendar",
  OCR: "https://asia-east2-content-management-syste-c40d1.cloudfunctions.net",
  unleash: "https://admin.uat.manabie.io/unleash",
  unleashKey:
    "ce4ed2eba3a72d6b5be23c7aa9b71178753f5908cf2dcbbca29442b5b81d397f",
  draft: "https://admin.uat.manabie.io/draftv2",
  zeus: "https://admin.uat.manabie.io/zeusv2",
  grpcTranscode: "https://api.uat.manabie.io",
};

const endpointStaging: EndpointGroups = {
  gRPC: "https://web-api.staging-green.manabie.io",
  bobGraphQL: "https://admin.staging-green.manabie.io",
  mastermgmtGraphQL: "https://admin.staging-green.manabie.io/mastermgmt",
  eurekaGraphQL: "https://admin.staging-green.manabie.io/eureka",
  fatimaGraphQL: "https://admin.staging-green.manabie.io/fatima",
  invoicemgmtGraphQL: "https://admin.staging-green.manabie.io/invoicemgmt",
  entryexitmgmtGraphQL: "https://admin.staging-green.manabie.io/entryexitmgmt",
  timesheetGraphQL: "https://admin.staging-green.manabie.io/timesheet",
  calendarGraphQL: "https://admin.staging-green.manabie.io/calendar",
  OCR: "https://asia-east2-content-management-syste-c40d1.cloudfunctions.net",
  unleash: "https://admin.staging-green.manabie.io/unleash",
  unleashKey:
    "ce4ed2eba3a72d6b5be23c7aa9b71178753f5908cf2dcbbca29442b5b81d397f",
  draft: "https://admin.staging.manabie.io/draftv2",
  zeus: "https://admin.staging.manabie.io/zeusv2",
  grpcTranscode: "https://api.staging-green.manabie.io",
};

const configs: ConfigurationEnvKeys = {
  [EnvKeys.STAGING]: endpointStaging,
  [EnvKeys.UAT]: endpointUAT,
  [EnvKeys.PRODUCTION]: endpointProduction,
};

export default configs;
