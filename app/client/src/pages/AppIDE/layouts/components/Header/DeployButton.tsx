import { Button, Tooltip } from "@appsmith/ads";
import { objectKeys } from "@appsmith/utils";
import { showConnectGitModal } from "actions/gitSyncActions";
import { publishApplication } from "ee/actions/applicationActions";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import type { NavigationSetting } from "constants/AppConstants";
import {
  createMessage,
  DEPLOY_BUTTON_TOOLTIP,
  DEPLOY_MENU_OPTION,
  PACKAGE_UPGRADING_ACTION_STATUS,
} from "ee/constants/messages";
import { getIsPackageUpgrading } from "ee/selectors/packageSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useGitOps } from "git/hooks";
import {
  useGitProtectedMode,
  useGitConnected,
  useGitModEnabled,
} from "pages/Editor/gitSync/hooks/modHooks";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getIsPublishingApplication,
} from "selectors/editorSelectors";
import styled from "styled-components";

// This wrapper maintains pointer events for tooltips when the child button is disabled.
// Without this, disabled buttons won't trigger tooltips because they have pointer-events: none
const StyledTooltipTarget = styled.span`
  display: inline-block;
`;

function DeployButton() {
  const applicationId = useSelector(getCurrentApplicationId);
  const currentApplication = useSelector(getCurrentApplication);
  const isPackageUpgrading = useSelector(getIsPackageUpgrading);
  const isProtectedMode = useGitProtectedMode();
  const isDeployDisabled = isPackageUpgrading || isProtectedMode;
  const isPublishing = useSelector(getIsPublishingApplication);
  const isGitConnected = useGitConnected();
  const isGitModEnabled = useGitModEnabled();
  const { toggleOpsModal } = useGitOps();

  const deployTooltipText = isPackageUpgrading
    ? createMessage(PACKAGE_UPGRADING_ACTION_STATUS, "deploy this app")
    : createMessage(DEPLOY_BUTTON_TOOLTIP);

  const dispatch = useDispatch();

  const handlePublish = useCallback(() => {
    if (applicationId) {
      dispatch(publishApplication(applicationId));

      const appName = currentApplication ? currentApplication.name : "";
      const pageCount = currentApplication?.pages?.length;
      const navigationSettingsWithPrefix: Record<
        string,
        NavigationSetting[keyof NavigationSetting]
      > = {};

      if (currentApplication?.applicationDetail?.navigationSetting) {
        const settingKeys = objectKeys(
          currentApplication.applicationDetail.navigationSetting,
        ) as Array<keyof NavigationSetting>;

        settingKeys.map((key: keyof NavigationSetting) => {
          if (currentApplication?.applicationDetail?.navigationSetting?.[key]) {
            const value: NavigationSetting[keyof NavigationSetting] =
              currentApplication.applicationDetail.navigationSetting[key];

            navigationSettingsWithPrefix[`navigationSetting_${key}`] = value;
          }
        });
      }

      AnalyticsUtil.logEvent("PUBLISH_APP", {
        appId: applicationId,
        appName,
        pageCount,
        ...navigationSettingsWithPrefix,
        isPublic: !!currentApplication?.isPublic,
        templateTitle: currentApplication?.forkedFromTemplateTitle,
      });
    }
  }, [applicationId, currentApplication, dispatch]);

  const handleClickDeploy = useCallback(() => {
    if (isGitConnected) {
      if (isGitModEnabled) {
        toggleOpsModal(true);
      } else {
        dispatch(showConnectGitModal());
      }

      AnalyticsUtil.logEvent("GS_DEPLOY_GIT_CLICK", {
        source: "Deploy button",
      });
    } else {
      handlePublish();
    }
  }, [
    dispatch,
    handlePublish,
    isGitConnected,
    isGitModEnabled,
    toggleOpsModal,
  ]);

  return (
    <Tooltip content={deployTooltipText} placement="bottomRight">
      <StyledTooltipTarget>
        <Button
          className="t--application-publish-btn"
          data-guided-tour-iid="deploy"
          id={"application-publish-btn"}
          isDisabled={isDeployDisabled}
          isLoading={isPublishing}
          kind="tertiary"
          onClick={handleClickDeploy}
          size="md"
          startIcon={"rocket"}
        >
          {createMessage(DEPLOY_MENU_OPTION)}
        </Button>
      </StyledTooltipTarget>
    </Tooltip>
  );
}

export default DeployButton;
