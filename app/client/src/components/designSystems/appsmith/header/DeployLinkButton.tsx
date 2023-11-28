import type { ReactNode } from "react";
import React from "react";
import { Menu, MenuItem, MenuContent, MenuTrigger } from "design-system";
import { useSelector, useDispatch } from "react-redux";
import { getIsGitConnected } from "selectors/gitSyncSelectors";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  CONNECT_TO_GIT_OPTION,
  CURRENT_DEPLOY_PREVIEW_OPTION,
} from "@appsmith/constants/messages";
import { Button } from "design-system";
import { KBEditorMenuItem } from "@appsmith/pages/Editor/KnowledgeBase/KBEditorMenuItem";
import { useIsGitAdmin } from "pages/Editor/gitSync/hooks/useIsGitAdmin";

interface Props {
  trigger: ReactNode;
  link: string;
}

export const DeployLinkButton = (props: Props) => {
  const dispatch = useDispatch();
  const isGitConnected = useSelector(getIsGitConnected);
  const isGitAdmin = useIsGitAdmin();

  const goToGitConnectionPopup = () => {
    AnalyticsUtil.logEvent("GS_CONNECT_GIT_CLICK", {
      source: "Deploy button",
    });
    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.GIT_CONNECTION,
      }),
    );
  };

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
        {!isGitConnected && isGitAdmin && (
          <MenuItem
            className="t--connect-to-git-btn"
            onClick={goToGitConnectionPopup}
            startIcon="git-branch"
          >
            {CONNECT_TO_GIT_OPTION()}
          </MenuItem>
        )}
        <MenuItem
          className="t--current-deployed-preview-btn"
          onClick={() => {
            if (window) {
              window.open(props.link, "_blank")?.focus();
            }
          }}
          startIcon="share-box-line"
        >
          {CURRENT_DEPLOY_PREVIEW_OPTION()}
        </MenuItem>
        <KBEditorMenuItem />
      </MenuContent>
    </Menu>
  );
};

export default DeployLinkButton;
