import type { EnvTypes, RampSection, SupportedRampsType } from "./RampTypes";
import {
  CUSTOM_ROLES,
  INVITE_USER_TO_APP,
  RAMP_FOR_ROLES,
  RAMP_NAME,
} from "./RampsControlList";
import { getAppsmithConfigs } from "@appsmith/configs";
import store from "store";

const { cloudHosting } = getAppsmithConfigs();

export const PRODUCT_RAMPS_LIST: { [key: string]: SupportedRampsType } = {
  [RAMP_NAME.INVITE_USER_TO_APP]: INVITE_USER_TO_APP,
  [RAMP_NAME.CUSTOM_ROLES]: CUSTOM_ROLES,
};

export const RAMP_LINK_TO = "https://appsmith.com/pricing";

export const getRampLink = (section: RampSection) => {
  const state = store.getState();
  const instanceId = state?.tenant?.instanceId;
  const source = cloudHosting ? "cloud" : "CE";
  return `${RAMP_LINK_TO}?source=${source}&instanceId=${instanceId}&feature=GAC&section=${section}`;
};

export const getUserRoleInWorkspace = () => {
  const state = store.getState();
  const { currentUser } = state?.ui?.users;
  const isSuperUser = currentUser?.isSuperUser;
  if (isSuperUser) return RAMP_FOR_ROLES.SUPER_USER;
  const workspaceUsers = state?.ui?.workspaces?.workspaceUsers;
  if (workspaceUsers?.length) {
    const workspaceUser = workspaceUsers.find(
      (user: any) => user?.username === currentUser?.username,
    );
    if (workspaceUser?.roles?.length) {
      const [role] = workspaceUser.roles[0]?.name?.split("-");
      if (role) {
        return role.trim();
      }
    }
  }
};

export const showProductRamps = (rampName: string) => {
  const role = getUserRoleInWorkspace();
  const env: EnvTypes = cloudHosting ? "CLOUD_HOSTED" : "SELF_HOSTED";
  if (rampName in PRODUCT_RAMPS_LIST) {
    const rampConfig = PRODUCT_RAMPS_LIST[rampName][env];
    return rampConfig[role];
  }
  return false;
};
