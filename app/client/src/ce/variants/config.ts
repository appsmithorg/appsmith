export interface EndpointGroups {
  OCR: string;
  gRPC: string;
  bobGraphQL: string;
  mastermgmtGraphQL: string;
  eurekaGraphQL: string;
  fatimaGraphQL: string;
  calendarGraphQL: string;
  timesheetGraphQL: string;
  invoicemgmtGraphQL: string;
  entryexitmgmtGraphQL: string;
  unleash: string;
  unleashKey: string;
  draft: string;
  zeus: string;
  grpcTranscode: string;
}

export enum EnvKeys {
  UAT = "uat",
  STAGING = "staging",
  PRODUCTION = "production",
}

export type ConfigurationEnvKeys = {
  [x in EnvKeys]: EndpointGroups;
};

export enum PjOwner {
  GA = "ga",
  JPREP = "jprep",
  MANABIE = "manabie",
  RENSEIKAI = "renseikai",
  SYNERSIA = "synersia",
  AIC = "aic",
  E2E = "e2e",
  TOKYO = "tokyo",
}

export const initNewConfigWithOrganization = async (
  organization?: PjOwner,
  branch?: EnvKeys,
): Promise<EndpointGroups> => {
  const owner = organization || PjOwner.MANABIE;
  const env = branch || EnvKeys.STAGING;
  const { default: configs } = await import(`./${owner}.ts`);

  return configs[env];
};
export const branchList: string[] = ["staging", "uat", "production"];

export const orgList: string[] = [
  "ga",
  "jprep",
  "manabie",
  "renseikai",
  "aic",
  "e2e",
  "tokyo",
];
