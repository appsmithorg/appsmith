import { createSelector } from "reselect";
import type { AppState } from "@appsmith/reducers";
import { getAppsmithConfigs } from "@appsmith/configs";
import { PRICING_PAGE_URL } from "constants/ThirdPartyConstants";
import {
  PRODUCT_RAMPS_LIST,
  RAMP_FOR_ROLES,
} from "../utils/ProductRamps/RampsControlList";
import type { EnvTypes } from "../utils/ProductRamps/RampTypes";

const { cloudHosting, pricingUrl } = getAppsmithConfigs();

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
    const RAMP_LINK_TO = PRICING_PAGE_URL(pricingUrl, source, instanceId);
    return `${RAMP_LINK_TO}&feature=${feature}&section=${section}`;
  });

export const showProductRamps = (rampName: string) =>
  createSelector(uiState, (ui) => {
    function getUserRoleInWorkspace() {
      const { currentUser } = ui?.users;
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
