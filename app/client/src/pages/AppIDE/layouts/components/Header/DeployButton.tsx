import { Button, Tooltip } from "@appsmith/ads";
import { showConnectGitModal } from "actions/gitSyncActions";
import {
  publishAnvilApplication,
  publishApplication,
} from "ee/actions/applicationActions";
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
import { getIsAnvilEnabledInCurrentApplication } from "layoutSystems/anvil/integrations/selectors";

// This wrapper maintains pointer events for tooltips when the child button is disabled.
// Without this, disabled buttons won't trigger tooltips because they have pointer-events: none
const StyledTooltipTarget = styled.span`
  display: inline-block;
`;

function DeployButton() {
  const applicationId = useSelector(getCurrentApplicationId);
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

  const isAnvilEnabled = useSelector(getIsAnvilEnabledInCurrentApplication);

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
    } else if (isAnvilEnabled) {
      dispatch(publishAnvilApplication(applicationId));
    } else {
      dispatch(publishApplication(applicationId));
    }
  }, [
    applicationId,
    dispatch,
    isAnvilEnabled,
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
