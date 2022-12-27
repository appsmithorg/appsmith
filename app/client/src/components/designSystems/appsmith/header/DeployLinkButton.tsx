import React, { ReactNode, useState } from "react";
import styled, { withTheme } from "styled-components";
import { Icon, Popover, PopoverPosition } from "@blueprintjs/core";
import { Theme } from "constants/DefaultTheme";
import { useSelector, useDispatch } from "react-redux";
import { getIsGitConnected } from "selectors/gitSyncSelectors";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import { Colors } from "constants/Colors";

import { ReactComponent as GitBranch } from "assets/icons/ads/git-branch.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  CONNECT_TO_GIT_OPTION,
  CURRENT_DEPLOY_PREVIEW_OPTION,
} from "@appsmith/constants/messages";

const DeployLinkDialog = styled.div`
  flex-direction: column;
  display: flex;
  align-items: center;
  /* padding: 10px; */
  background-color: ${(props) =>
    props.theme.colors.header.deployToolTipBackground};
`;

const DeployLink = styled.a`
  display: flex;
  height: 36px;

  width: 100%;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
  color: ${Colors.GREY_10};
  background-color: ${Colors.GREY_1};
  margin: 0 5px;
  :hover {
    text-decoration: none;
    color: ${(props) => props.theme.colors.header.deployToolTipText};
    background-color: ${Colors.GREY_2};
  }
`;

const DeployUrl = styled.div`
  flex: 1;
  font-size: 14px;
  color: ${Colors.GREY_10};
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const GitBranchIcon = styled(GitBranch)`
  & path {
    fill: ${Colors.GREY_10};
  }
`;

const IconWrapper = styled.div`
  display: flex;
  width: 30px;
  justify-content: center;
`;

type Props = {
  trigger: ReactNode;
  link: string;
  theme: Theme;
};

export const DeployLinkButton = withTheme((props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const isGitConnected = useSelector(getIsGitConnected);

  const onClose = () => {
    setIsOpen(false);
  };

  const goToGitConnectionPopup = () => {
    setIsOpen(false);
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
    <Popover
      canEscapeKeyClose={false}
      content={
        <DeployLinkDialog>
          {!isGitConnected && (
            <DeployLink
              className="t--connect-to-git-btn"
              onClick={goToGitConnectionPopup}
            >
              <IconWrapper>
                <GitBranchIcon />
              </IconWrapper>
              <DeployUrl>{CONNECT_TO_GIT_OPTION()}</DeployUrl>
            </DeployLink>
          )}

          <DeployLink
            className="t--current-deployed-preview-btn"
            href={props.link}
            onClick={onClose}
            target="_blank"
          >
            <IconWrapper>
              <Icon
                color={props.theme.colors.header.deployToolTipText}
                icon="share"
              />
            </IconWrapper>
            <DeployUrl>{CURRENT_DEPLOY_PREVIEW_OPTION()}</DeployUrl>
          </DeployLink>
        </DeployLinkDialog>
      }
      isOpen={isOpen}
      modifiers={{ offset: { enabled: true, offset: "0, -3" } }}
      onClose={onClose}
      position={PopoverPosition.BOTTOM_RIGHT}
      transitionDuration={0}
    >
      <div
        className="t--deploy-popup-option-trigger"
        onClick={() => setIsOpen(true)}
      >
        {props.trigger}
      </div>
    </Popover>
  );
});

export default DeployLinkButton;
