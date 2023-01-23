export * from "ce/pages/Home/LeftPaneBottomSection";
import {
  Wrapper,
  LeftPaneVersionData,
} from "ce/pages/Home/LeftPaneBottomSection";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { Classes as BlueprintClasses } from "@blueprintjs/core";
import { MenuItem } from "design-system-old";
import {
  ADMIN_SETTINGS,
  APPSMITH_DISPLAY_VERSION,
  createMessage,
  DOCUMENTATION,
  UPGRADE_TO_BUSINESS,
  WELCOME_TOUR,
} from "@appsmith/constants/messages";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { getOnboardingWorkspaces } from "selectors/onboardingSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { howMuchTimeBeforeText } from "utils/helpers";
import { onboardingCreateApplication } from "actions/onboardingActions";
import ProductUpdatesModal from "pages/Applications/ProductUpdatesModal";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "pages/common/CustomizedDropdown/dropdownHelpers";
import { getCurrentUser, selectFeatureFlags } from "selectors/usersSelectors";
import {
  getDefaultAdminSettingsPath,
  showAdminSettings,
} from "@appsmith/utils/adminSettingsHelpers";
import {
  getTenantPermissions,
  isTrialLicense,
} from "@appsmith/selectors/tenantSelectors";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";

const StyledWrapper = styled(Wrapper)`
  .business-plan-menu-option {
    .cs-text {
      color: var(--appsmith-color-orange-700);
    }
    svg path {
      fill: var(--appsmith-color-orange-700);
    }
  }
`;

function LeftPaneBottomSection() {
  const dispatch = useDispatch();
  const onboardingWorkspaces = useSelector(getOnboardingWorkspaces);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const { appVersion, cloudHosting } = getAppsmithConfigs();
  const howMuchTimeBefore = howMuchTimeBeforeText(appVersion.releaseDate);
  const user = useSelector(getCurrentUser);
  const tenantPermissions = useSelector(getTenantPermissions);
  const isTrial = useSelector(isTrialLicense);
  const isUsageAndBillingEnabled = useSelector(selectFeatureFlags)
    ?.USAGE_AND_BILLING;

  return (
    <StyledWrapper>
      {isUsageAndBillingEnabled && isTrial && (
        <MenuItem
          className="business-plan-menu-option"
          icon="upload-cloud"
          onSelect={goToCustomerPortal}
          text={createMessage(UPGRADE_TO_BUSINESS)}
        />
      )}
      {showAdminSettings(user) && !isFetchingApplications && (
        <MenuItem
          className="admin-settings-menu-option"
          icon="setting"
          onSelect={() => {
            getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
              path: getDefaultAdminSettingsPath({
                isSuperUser: user?.isSuperUser,
                tenantPermissions,
              }),
            });
          }}
          text={createMessage(ADMIN_SETTINGS)}
        />
      )}
      <MenuItem
        className={isFetchingApplications ? BlueprintClasses.SKELETON : ""}
        icon="discord"
        onSelect={() => {
          window.open("https://discord.gg/rBTTVJp", "_blank");
        }}
        text={"Join our Discord"}
      />
      <MenuItem
        containerClassName={
          isFetchingApplications ? BlueprintClasses.SKELETON : ""
        }
        icon="book"
        onSelect={() => {
          window.open("https://docs.appsmith.com/", "_blank");
        }}
        text={createMessage(DOCUMENTATION)}
      />
      {!!onboardingWorkspaces.length && (
        <MenuItem
          containerClassName={
            isFetchingApplications
              ? BlueprintClasses.SKELETON
              : "t--welcome-tour"
          }
          icon="guide"
          onSelect={() => {
            AnalyticsUtil.logEvent("WELCOME_TOUR_CLICK");
            dispatch(onboardingCreateApplication());
          }}
          text={createMessage(WELCOME_TOUR)}
        />
      )}
      <ProductUpdatesModal />
      <LeftPaneVersionData>
        <span>
          {createMessage(
            APPSMITH_DISPLAY_VERSION,
            appVersion.edition,
            appVersion.id,
            cloudHosting,
          )}
        </span>
        {howMuchTimeBefore !== "" && (
          <span>Released {howMuchTimeBefore} ago</span>
        )}
      </LeftPaneVersionData>
    </StyledWrapper>
  );
}

export default LeftPaneBottomSection;
