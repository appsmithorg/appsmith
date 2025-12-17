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
  UNCOMMITTED_CHANGES,
  REDEPLOY_APP_BUTTON_TOOLTIP,
} from "ee/constants/messages";
import { getIsPackageUpgrading } from "ee/selectors/packageSelectors";
import { getRedeployApplicationTrigger } from "ee/selectors/applicationSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useGitOps } from "git/hooks";
import useArtifactSelector from "git/hooks/useArtifactSelector";
import { selectStatusState } from "git/store/selectors/gitArtifactSelectors";
import {
  useGitProtectedMode,
  useGitConnected,
  useGitModEnabled,
} from "pages/Editor/gitSync/hooks/modHooks";
import React, { useCallback, useMemo } from "react";
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
  const gitStatusState = useArtifactSelector(selectStatusState);
  const redeployTrigger = useSelector(getRedeployApplicationTrigger);

  const tooltipText = useMemo(() => {
    if (isPackageUpgrading) {
      return createMessage(PACKAGE_UPGRADING_ACTION_STATUS, "deploy this app");
    }

    if (isGitConnected && !gitStatusState?.loading) {
      const hasPendingCommits =
        gitStatusState?.value && !gitStatusState.value.isClean;

      if (hasPendingCommits) {
        return createMessage(UNCOMMITTED_CHANGES);
      }

      if (redeployTrigger) {
        return createMessage(REDEPLOY_APP_BUTTON_TOOLTIP);
      }
    }

    return createMessage(DEPLOY_BUTTON_TOOLTIP);
  }, [isPackageUpgrading, isGitConnected, gitStatusState, redeployTrigger]);

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

  const startIcon = useMemo(() => {
    if (isGitConnected && !gitStatusState?.loading) {
      const hasPendingCommits =
        gitStatusState?.value && !gitStatusState.value.isClean;

      if (!hasPendingCommits && redeployTrigger) {
        return "rocket-dot";
      }

      if (hasPendingCommits) {
        return "rocket-dot";
      }
    }

    return "rocket";
  }, [isGitConnected, gitStatusState, redeployTrigger]);

  return (
    <Tooltip content={tooltipText} placement="bottomRight">
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
          startIcon={startIcon}
        >
          {createMessage(DEPLOY_MENU_OPTION)}
        </Button>
      </StyledTooltipTarget>
    </Tooltip>
  );
}

export default DeployButton;
