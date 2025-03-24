import React, { useCallback } from "react";
import { Menu, MenuItem, MenuContent, MenuTrigger } from "@appsmith/ads";
import { useSelector, useDispatch } from "react-redux";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  CONNECT_TO_GIT_OPTION,
  CURRENT_DEPLOY_PREVIEW_OPTION,
} from "ee/constants/messages";
import { Button } from "@appsmith/ads";
import { KBEditorMenuItem } from "ee/pages/Editor/KnowledgeBase/KBEditorMenuItem";
import { getIsAnvilEnabledInCurrentApplication } from "layoutSystems/anvil/integrations/selectors";
import { useGitModEnabled } from "pages/Editor/gitSync/hooks/modHooks";
import { GitDeployMenuItems as GitDeployMenuItemsNew } from "git";

function GitDeployMenuItems() {
  const isGitModEnabled = useGitModEnabled();

  const dispatch = useDispatch();
  const goToGitConnectionPopup = useCallback(() => {
    AnalyticsUtil.logEvent("GS_CONNECT_GIT_CLICK", {
      source: "Deploy button",
    });

    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.GIT_CONNECTION,
      }),
    );
  }, [dispatch]);

  return isGitModEnabled ? (
    <GitDeployMenuItemsNew />
  ) : (
    <MenuItem
      className="t--connect-to-git-btn"
      onClick={goToGitConnectionPopup}
      startIcon="git-branch"
    >
      {CONNECT_TO_GIT_OPTION()}
    </MenuItem>
  );
}

interface ChevronMenuProps {
  deployLink: string;
}

export const ChevronMenu = ({ deployLink }: ChevronMenuProps) => {
  // We check if the current application is an Anvil application.
  // If it is an Anvil application, we remove the Git features from the deploy button
  // as they donot yet work correctly with Anvil.
  const isAnvilEnabled = useSelector(getIsAnvilEnabledInCurrentApplication);

  const handleClickOnLatestDeployed = useCallback(() => {
    if (window) {
      window.open(deployLink, "_blank")?.focus();
    }
  }, [deployLink]);

  return (
    <Menu>
      <MenuTrigger>
        <Button
          className="t--deploy-popup-option-trigger"
          isIconButton
          kind="tertiary"
          size="md"
          startIcon={"down-arrow"}
        />
      </MenuTrigger>
      <MenuContent>
        {!isAnvilEnabled && <GitDeployMenuItems />}
        <MenuItem
          className="t--current-deployed-preview-btn"
          onClick={handleClickOnLatestDeployed}
          startIcon="share-box-line"
        >
          {CURRENT_DEPLOY_PREVIEW_OPTION()}
        </MenuItem>
        <KBEditorMenuItem />
      </MenuContent>
    </Menu>
  );
};

export default ChevronMenu;
