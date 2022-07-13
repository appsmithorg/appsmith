import React from "react";
import styled, { useTheme } from "styled-components";
import { Overlay, Classes } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { setIsGitErrorPopupVisible } from "actions/gitSyncActions";
import {
  getConflictFoundDocUrlDeploy,
  getIsGitErrorPopupVisible,
} from "selectors/gitSyncSelectors";
import Icon, { IconSize } from "components/ads/Icon";

import {
  createMessage,
  CONFLICTS_FOUND_WHILE_PULLING_CHANGES,
} from "@appsmith/constants/messages";
import { Space } from "./StyledComponents";
import { Colors } from "constants/Colors";
import { get } from "lodash";

import ConflictInfo from "../components/ConflictInfo";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";

const StyledGitErrorPopup = styled.div`
  & {
    .${Classes.OVERLAY} {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;

      .${Classes.OVERLAY_CONTENT} {
        overflow: hidden;
        bottom: ${(props) =>
          `calc(${props.theme.bottomBarHeight} + ${props.theme.spaces[3]}px)`};
        left: ${(props) => props.theme.spaces[3]}px;
        background-color: ${Colors.WHITE};
      }
    }

    .git-error-popup {
      width: 364px;
      padding: ${(props) => props.theme.spaces[7]}px;

      display: flex;
      flex-direction: column;
    }
  }
`;

function Header({ closePopup }: { closePopup: () => void }) {
  const title = createMessage(CONFLICTS_FOUND_WHILE_PULLING_CHANGES);
  const theme = useTheme();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span className="title">{title}</span>
      </div>
      <Icon
        fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
        hoverFillColor={Colors.BLACK}
        name="close-modal"
        onClick={closePopup}
        size={IconSize.XXXXL}
      />
    </div>
  );
}

function GitErrorPopup() {
  const dispatch = useDispatch();
  const isGitErrorPopupVisible = useSelector(getIsGitErrorPopupVisible);
  const hidePopup = () => {
    dispatch(setIsGitErrorPopupVisible({ isVisible: false }));
  };

  const gitConflictDocumentUrl = useSelector(getConflictFoundDocUrlDeploy);
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const browserSupportedRemoteUrl =
    gitMetaData?.browserSupportedRemoteUrl || "";
  const isConflicting = true; // refactored

  return (
    <StyledGitErrorPopup>
      <Overlay
        hasBackdrop
        isOpen={isGitErrorPopupVisible}
        onClose={hidePopup}
        transitionDuration={25}
        usePortal={false}
      >
        <div className={Classes.OVERLAY_CONTENT}>
          <div className="git-error-popup">
            <Header closePopup={hidePopup} />
            <Space size={2} />
            {isConflicting && (
              <ConflictInfo
                browserSupportedRemoteUrl={browserSupportedRemoteUrl}
                learnMoreLink={gitConflictDocumentUrl}
              />
            )}
          </div>
        </div>
      </Overlay>
    </StyledGitErrorPopup>
  );
}

export default GitErrorPopup;
