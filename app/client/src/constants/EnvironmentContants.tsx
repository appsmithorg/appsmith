export const DEFAULT_ENV_ID = "unused_env";

export interface EnvironmentType {
  id: string;
  name: string;
  selected: boolean;
  userPermissions: string[];
}

export const environmentList: Array<EnvironmentType> = [
  {
    id: DEFAULT_ENV_ID,
    name: "production",
    selected: true,
    userPermissions: [],
  },
  {
    id: DEFAULT_ENV_ID,
    name: "staging",
    selected: false,
    userPermissions: [],
  },
];
