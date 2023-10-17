import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { MenuItem } from "design-system-old";
import {
  ADMIN_SETTINGS,
  APPSMITH_DISPLAY_VERSION,
  createMessage,
  DOCUMENTATION,
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
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { ShowUpgradeMenuItem } from "@appsmith/utils/licenseHelpers";
import { DISCORD_URL, DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getAdminSettingsPath,
  getShowAdminSettings,
} from "@appsmith/utils/BusinessFeatures/adminSettingsHelpers";

export const Wrapper = styled.div`
  background-color: var(--ads-v2-color-bg);
  width: 100%;
  margin-top: auto;
  border-top: 1px solid var(--ads-v2-color-border);
`;

export const MenuWrapper = styled.div`
  margin-top: 4px;
`;

export const LeftPaneVersionData = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: var(--ads-v2-color-fg-muted);
  font-size: 8px;
  margin-top: ${(props) => props.theme.spaces[3]}px;
  // reduce border width from 1px from width
  width: calc(${(props) => props.theme.homePage.sidebar}px - 1px);
  position: relative;
  left: -16px;
  padding: 8px 30px;
  background: var(--ads-v2-color-bg-subtle);
`;

function LeftPaneBottomSection() {
  const dispatch = useDispatch();
  const onboardingWorkspaces = useSelector(getOnboardingWorkspaces);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const { appVersion } = getAppsmithConfigs();
  const howMuchTimeBefore = howMuchTimeBeforeText(appVersion.releaseDate);
  const user = useSelector(getCurrentUser);
  const tenantPermissions = useSelector(getTenantPermissions);
  const [isProductUpdatesModalOpen, setIsProductUpdatesModalOpen] =
    useState(false);
  const isAirgappedInstance = isAirgapped();
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  return (
    <Wrapper>
      <MenuWrapper>
        <ShowUpgradeMenuItem />
        {getShowAdminSettings(isFeatureEnabled, user) &&
          !isFetchingApplications && (
            <MenuItem
              className="admin-settings-menu-option"
              icon="setting"
              onSelect={() => {
                getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                  path: getAdminSettingsPath(
                    isFeatureEnabled,
                    user?.isSuperUser,
                    tenantPermissions,
                  ),
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
                window.open(DISCORD_URL, "_blank");
              }}
              text={"Join our discord"}
            />
            <MenuItem
              icon="book"
              onSelect={() => {
                window.open(DOCS_BASE_URL, "_blank");
              }}
              text={createMessage(DOCUMENTATION)}
            />

            <MenuItem
              containerClassName={"t--welcome-tour"}
              icon="guide"
              onSelect={() => {
                if (!isFetchingApplications && !!onboardingWorkspaces.length) {
                  AnalyticsUtil.logEvent("WELCOME_TOUR_CLICK");
                  dispatch(onboardingCreateApplication());
                }
              }}
              text={createMessage(WELCOME_TOUR)}
            />
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
            )}
          </span>
          {howMuchTimeBefore !== "" && (
            <span>Released {howMuchTimeBefore} ago</span>
          )}
        </LeftPaneVersionData>
      </MenuWrapper>
    </Wrapper>
  );
}

export default LeftPaneBottomSection;
