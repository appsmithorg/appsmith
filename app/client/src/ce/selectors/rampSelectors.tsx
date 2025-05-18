import { createSelector } from "reselect";
import type { DefaultRootState } from "react-redux";
import { getAppsmithConfigs } from "ee/configs";
import {
  CUSTOMER_PORTAL_URL_WITH_PARAMS,
  PRICING_PAGE_URL,
} from "constants/ThirdPartyConstants";
import {
  PRODUCT_RAMPS_LIST,
  RAMP_FOR_ROLES,
} from "utils/ProductRamps/RampsControlList";
import type { EnvTypes } from "utils/ProductRamps/RampTypes";
import { isPermitted, PERMISSION_TYPE } from "ee/utils/permissionHelpers";
import { selectFeatureFlags } from "./featureFlagsSelectors";
import { isMultiOrgFFEnabled } from "ee/utils/planHelpers";
import { WORKSPACE_SETTINGS_LICENSE_PAGE_URL } from "constants/routes";

const { cloudHosting, customerPortalUrl, pricingUrl } = getAppsmithConfigs();

const organizationState = (state: DefaultRootState) => state.organization;
const uiState = (state: DefaultRootState) => state.ui;

export const getRampLink = ({
  feature,
  isBusinessFeature = true,
  section,
}: {
  section: string;
  feature: string;
  isBusinessFeature?: boolean;
}) =>
  createSelector(
    organizationState,
    selectFeatureFlags,
    (organization, featureFlags) => {
      const instanceId = organization?.instanceId;
      const source = cloudHosting ? "cloud" : "CE";
      const isCloudBillingEnabled = isMultiOrgFFEnabled(featureFlags);

      if (isCloudBillingEnabled) {
        return WORKSPACE_SETTINGS_LICENSE_PAGE_URL;
      }

      const RAMP_LINK_TO = isBusinessFeature
        ? CUSTOMER_PORTAL_URL_WITH_PARAMS(
            customerPortalUrl,
            source,
            instanceId,
            feature,
            section,
          )
        : PRICING_PAGE_URL(pricingUrl, source, instanceId, feature, section);

      return RAMP_LINK_TO;
    },
  );

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

      const workspaceUsers = ui?.selectedWorkspace?.users;

      if (workspaceUsers?.length) {
        const workspaceUser = workspaceUsers.find(
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
