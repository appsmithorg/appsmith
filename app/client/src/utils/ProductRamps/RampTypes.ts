export type EnvTypes = "CLOUD_HOSTED" | "SELF_HOSTED";
export type RampSection =
  | "workspace_share"
  | "app_share"
  | "share_modal"
  | "app_settings";

export type RampsForRolesTypes = {
  [key: string]: boolean;
};

export type SupportedRampsType = {
  [key in EnvTypes]: RampsForRolesTypes;
};
