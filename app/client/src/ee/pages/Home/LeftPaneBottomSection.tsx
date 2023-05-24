export * from "ce/pages/Home/LeftPaneBottomSection";
import {
  Wrapper,
  LeftPaneVersionData,
} from "ce/pages/Home/LeftPaneBottomSection";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { MenuItem } from "design-system-old";
import {
  ADMIN_SETTINGS,
  APPSMITH_DISPLAY_VERSION,
  createMessage,
  DOCUMENTATION,
  UPGRADE,
  WELCOME_TOUR,
} from "@appsmith/constants/messages";
import { getIsFetchingApplications } from "@appsmith/selectors/applicationSelectors";
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
import { getCurrentUser } from "selectors/usersSelectors";
import {
  getDefaultAdminSettingsPath,
  showAdminSettings,
} from "@appsmith/utils/adminSettingsHelpers";
import {
  getTenantPermissions,
  isAdminUser,
  isTrialLicense,
} from "@appsmith/selectors/tenantSelectors";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";
import capitalize from "lodash/capitalize";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";

const StyledWrapper = styled(Wrapper)`
  .business-plan-menu-option {
    .cs-text {
      color: var(--appsmith-color-orange-500);
    }
    svg path {
      fill: var(--appsmith-color-orange-500);
    }
    &:hover {
      .cs-text {
        color: var(--appsmith-color-orange-800);
      }
      svg path {
        fill: var(--appsmith-color-orange-800);
      }
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
  const isAdmin = useSelector(isAdminUser);
  const isAirgappedInstance = isAirgapped();
  const [isProductUpdatesModalOpen, setIsProductUpdatesModalOpen] =
    useState(false);

  return (
    <StyledWrapper>
      {isTrial && isAdmin && !isAirgappedInstance && (
        <MenuItem
          className="business-plan-menu-option"
          data-testid="t--upgrade-to-business"
          icon="upload-cloud"
          onSelect={goToCustomerPortal}
          text={capitalize(createMessage(UPGRADE))}
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
      {!isAirgappedInstance && (
        <>
          <MenuItem
            icon="discord"
            onSelect={() => {
              window.open("https://discord.gg/rBTTVJp", "_blank");
            }}
            text={"Join our discord"}
          />
          <MenuItem
            icon="book"
            onSelect={() => {
              window.open("https://docs.appsmith.com/", "_blank");
            }}
            text={createMessage(DOCUMENTATION)}
          />
          {!!onboardingWorkspaces.length && (
            <MenuItem
              containerClassName={"t--welcome-tour"}
              icon="guide"
              onSelect={() => {
                AnalyticsUtil.logEvent("WELCOME_TOUR_CLICK");
                dispatch(onboardingCreateApplication());
              }}
              text={createMessage(WELCOME_TOUR)}
            />
          )}
          <MenuItem
            containerClassName={"t--product-updates-btn"}
            data-testid="t--product-updates-btn"
            icon="updates"
            onSelect={() => {
              setIsProductUpdatesModalOpen(true);
            }}
            text="What's new?"
          />
          <ProductUpdatesModal
            isOpen={isProductUpdatesModalOpen}
            onClose={() => setIsProductUpdatesModalOpen(false)}
          />
        </>
      )}
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
