import { getAppsmithConfigs } from "ee/configs";
import {
  ADMIN_SETTINGS,
  APPSMITH_DISPLAY_VERSION,
  CHAT_WITH_US,
  DOCUMENTATION,
  HELP,
  WHATS_NEW,
  createMessage,
} from "ee/constants/messages";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getCurrentApplicationIdForCreateNewApp } from "ee/selectors/applicationSelectors";
import { getTenantPermissions } from "ee/selectors/tenantSelectors";
import {
  getAdminSettingsPath,
  getShowAdminSettings,
} from "ee/utils/BusinessFeatures/adminSettingsHelpers";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { ShowUpgradeMenuItem } from "ee/utils/licenseHelpers";
import type { User } from "constants/userConstants";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Tooltip,
} from "@appsmith/ads";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouteMatch } from "react-router";
import { howMuchTimeBeforeText } from "utils/helpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "../CustomizedDropdown/dropdownHelpers";
import { IntercomConsent } from "pages/Editor/HelpButton";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import styled from "styled-components";
const { cloudHosting, intercomAppID } = getAppsmithConfigs();

export const VersionData = styled.div`
  display: flex;
  flex-direction: column;
  color: var(--ads-v2-color-fg-muted);
  font-size: 8px;
  position: relative;
  padding: 6px 12px 12px;
  gap: 4px;
`;

const HomepageHeaderAction = ({
  setIsProductUpdatesModalOpen,
  user,
}: {
  user: User;
  setIsProductUpdatesModalOpen: (val: boolean) => void;
}) => {
  const dispatch = useDispatch();
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const tenantPermissions = useSelector(getTenantPermissions);
  const isCreateNewAppFlow = useSelector(
    getCurrentApplicationIdForCreateNewApp,
  );
  const isHomePage = useRouteMatch("/applications")?.isExact;
  const isAirgappedInstance = isAirgapped();
  const { appVersion } = getAppsmithConfigs();
  const howMuchTimeBefore = howMuchTimeBeforeText(appVersion.releaseDate);
  const [showIntercomConsent, setShowIntercomConsent] = useState(false);

  if (!isHomePage || !!isCreateNewAppFlow) return null;

  return (
    <div className="flex items-center">
      <ShowUpgradeMenuItem />
      {getShowAdminSettings(isFeatureEnabled, user) && (
        <Tooltip content={createMessage(ADMIN_SETTINGS)} placement="bottom">
          <Button
            className="admin-settings-menu-option"
            isIconButton
            kind="tertiary"
            onClick={() => {
              getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                path: getAdminSettingsPath(
                  isFeatureEnabled,
                  user?.isSuperUser,
                  tenantPermissions,
                ),
              });
            }}
            size="md"
            startIcon="settings-control"
          />
        </Tooltip>
      )}
      {!isAirgappedInstance && (
        <Menu
          onOpenChange={(open) => {
            if (open) {
              setShowIntercomConsent(false);
              dispatch({
                type: ReduxActionTypes.FETCH_RELEASES,
              });
            }
          }}
        >
          <Tooltip content={createMessage(HELP)} placement="bottom">
            <MenuTrigger>
              <Button
                className="t--help-menu-option"
                isIconButton
                kind="tertiary"
                onClick={() => {}}
                size="md"
                startIcon="question-line"
              />
            </MenuTrigger>
          </Tooltip>
          <MenuContent align="end" width="172px">
            {showIntercomConsent ? (
              <IntercomConsent showIntercomConsent={setShowIntercomConsent} />
            ) : (
              <>
                <MenuItem
                  className="t--documentation-button"
                  onClick={() => {
                    window.open(DOCS_BASE_URL, "_blank");
                  }}
                  startIcon="book-line"
                >
                  {createMessage(DOCUMENTATION)}
                </MenuItem>
                {intercomAppID && window.Intercom && !isAirgapped() && (
                  <MenuItem
                    onSelect={(e) => {
                      if (user?.isIntercomConsentGiven || cloudHosting) {
                        window.Intercom("show");
                      } else {
                        e?.preventDefault();
                        setShowIntercomConsent(true);
                      }
                    }}
                    startIcon="chat-help"
                  >
                    {createMessage(CHAT_WITH_US)}
                  </MenuItem>
                )}
                <MenuSeparator className="mb-1" />
                <MenuItem
                  className="t--product-updates-btn"
                  data-testid="t--product-updates-btn"
                  onClick={() => {
                    setIsProductUpdatesModalOpen(true);
                  }}
                  startIcon="gift-line"
                >
                  {createMessage(WHATS_NEW)}
                </MenuItem>
                <VersionData>
                  <div>
                    {createMessage(
                      APPSMITH_DISPLAY_VERSION,
                      appVersion.edition,
                      appVersion.id.endsWith("-SNAPSHOT")
                        ? appVersion.sha.substring(0, 8)
                        : appVersion.id,
                    )}
                  </div>
                  {howMuchTimeBefore !== "" && (
                    <div>Released {howMuchTimeBefore} ago</div>
                  )}
                </VersionData>
              </>
            )}
          </MenuContent>
        </Menu>
      )}
    </div>
  );
};

export default HomepageHeaderAction;
