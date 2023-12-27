import { createSelector } from "reselect";
import type { AppState } from "@appsmith/reducers";
import { getAppsmithConfigs } from "@appsmith/configs";
import { CUSTOMER_PORTAL_URL_WITH_PARAMS } from "constants/ThirdPartyConstants";
import {
  PRODUCT_RAMPS_LIST,
  RAMP_FOR_ROLES,
} from "utils/ProductRamps/RampsControlList";
import type { EnvTypes } from "utils/ProductRamps/RampTypes";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";

const { cloudHosting, customerPortalUrl } = getAppsmithConfigs();

const tenantState = (state: AppState) => state.tenant;
const uiState = (state: AppState) => state.ui;

export const getRampLink = ({
  feature,
  section,
}: {
  section: string;
  feature: string;
}) =>
  createSelector(tenantState, (tenant) => {
    const instanceId = tenant?.instanceId;
    const source = cloudHosting ? "cloud" : "CE";
    const RAMP_LINK_TO = CUSTOMER_PORTAL_URL_WITH_PARAMS(
      customerPortalUrl,
      source,
      instanceId,
    );
    return `${RAMP_LINK_TO}&feature=${feature}&section=${section}`;
  });

export const showProductRamps = (
  rampName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isEnterpriseOnlyFeature = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isFeatureFlagEnabled?: boolean,
) =>
  createSelector(uiState, (ui) => {
    function getUserRoleInWorkspace() {
      const { currentUser } = ui?.users;
      const { currentApplication } = ui?.applications;
      const isSuperUser = currentUser?.isSuperUser;
      if (isSuperUser) return RAMP_FOR_ROLES.SUPER_USER;
      const workspaceUsers = ui?.workspaces?.workspaceUsers;
      if (workspaceUsers?.length) {
        const workspaceUser = workspaceUsers.find(
          (user: any) => user?.username === currentUser?.username,
        );
        if (workspaceUser?.roles?.length) {
          const roles = workspaceUser.roles[0]?.name;
          if (roles && typeof roles === "string") {
            const [role] = roles.split("-");
            if (role) {
              return role.trim();
            }
          }
        }
      } else if (
        !!currentApplication &&
        currentApplication.hasOwnProperty("userPermissions") &&
        !!currentApplication.userPermissions
      ) {
        return isPermitted(
          currentApplication.userPermissions,
          PERMISSION_TYPE.MANAGE_APPLICATION,
        )
          ? RAMP_FOR_ROLES.DEVELOPER
          : RAMP_FOR_ROLES.APP_VIEWER;
      }
    }

    const role = getUserRoleInWorkspace();
    const env: EnvTypes = cloudHosting ? "CLOUD_HOSTED" : "SELF_HOSTED";
    if (rampName in PRODUCT_RAMPS_LIST) {
      const rampConfig = PRODUCT_RAMPS_LIST[rampName][env];
      if (role) {
        return rampConfig[role];
      }
    }
    return false;
  });
