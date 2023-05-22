export type EnvTypes = "CLOUD_HOSTED" | "SELF_HOSTED";

export type RampsForRolesTypes = {
  [key: string]: boolean;
};

export type SupportedRampsType = {
  [key in EnvTypes]: RampsForRolesTypes;
};
