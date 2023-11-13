import type { EnvironmentType } from "@appsmith/configs/types";
import { PERMISSION_TYPE } from "../permissionHelpers";

export * from "ce/utils/Environments";

export const ENVIRONMENT_QUERY_KEY = "environment";

export const getFilteredEnvListWithPermissions = (
  envList: EnvironmentType[],
) => {
  return envList.filter(
    (env) =>
      env.userPermissions &&
      env.userPermissions.length > 0 &&
      env.userPermissions.includes(PERMISSION_TYPE.EXECUTE_ENVIRONMENT),
  );
};
