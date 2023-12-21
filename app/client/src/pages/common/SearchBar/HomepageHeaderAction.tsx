import { getAppsmithConfigs } from "@appsmith/configs";
import {
  ADMIN_SETTINGS,
  APPSMITH_DISPLAY_VERSION,
  CHAT_WITH_US,
  DOCUMENTATION,
  HELP,
  TRY_GUIDED_TOUR,
  WHATS_NEW,
  createMessage,
} from "@appsmith/constants/messages";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getCurrentApplicationIdForCreateNewApp } from "@appsmith/selectors/applicationSelectors";
import { getIsFetchingApplications } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import {
  getAdminSettingsPath,
  getShowAdminSettings,
} from "@appsmith/utils/BusinessFeatures/adminSettingsHelpers";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { ShowUpgradeMenuItem } from "@appsmith/utils/licenseHelpers";
import type { User } from "constants/userConstants";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Tooltip,
} from "design-system";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouteMatch } from "react-router";
import { getOnboardingWorkspaces } from "selectors/onboardingSelectors";
import { howMuchTimeBeforeText } from "utils/helpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import {
  DropdownOnSelectActions,
  getOnSelectAction,
} from "../CustomizedDropdown/dropdownHelpers";
import { IntercomConsent } from "pages/Editor/HelpButton";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { onboardingCreateApplication } from "actions/onboardingActions";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import { VersionData } from "../PageHeader";
const { cloudHosting, intercomAppID } = getAppsmithConfigs();

const HomepageHeaderAction = ({
  setIsProductUpdatesModalOpen,
  user,
}: {
  user: User;
  setIsProductUpdatesModalOpen: (val: boolean) => void;
}) => {
  const dispatch = useDispatch();
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const tenantPermissions = useSelector(getTenantPermissions);
  const onboardingWorkspaces = useSelector(getOnboardingWorkspaces);
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
                  className="t--welcome-tour"
                  onClick={() => {
                    if (
                      !isFetchingApplications &&
                      !!onboardingWorkspaces.length
                    ) {
                      AnalyticsUtil.logEvent("WELCOME_TOUR_CLICK");
                      dispatch(onboardingCreateApplication());
                    }
                  }}
                  startIcon="guide"
                >
                  {createMessage(TRY_GUIDED_TOUR)}
                </MenuItem>
                <MenuItem
                  className="t--welcome-tour"
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
