import React, { useRef } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import { Popover2 } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

import { getCurrentAppGitMetaData } from "ee/selectors/applicationSelectors";
import BranchList from "../components/BranchList";
import {
  getGitStatus,
  getIsPollingAutocommit,
  getIsTriggeringAutocommit,
  protectedModeSelector,
  showBranchPopupSelector,
} from "selectors/gitSyncSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { Button, Icon, Tooltip } from "@appsmith/ads";
import { isEllipsisActive } from "utils/helpers";
import { importRemixIcon } from "@appsmith/ads-old";
import { setShowBranchPopupAction } from "actions/gitSyncActions";

const ProtectedIcon = importRemixIcon(
  async () => import("remixicon-react/ShieldKeyholeLineIcon"),
);

const ButtonContainer = styled(Button)`
  display: flex;
  align-items: center;
  margin: 0 ${(props) => props.theme.spaces[4]}px;
  max-width: 122px;
  min-width: unset !important;

  :active {
    border: 1px solid var(--ads-v2-color-border-muted);
  }
`;

function BranchButton() {
  const dispatch = useDispatch();
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const isProtectedMode = useSelector(protectedModeSelector);
  const currentBranch = gitMetaData?.branchName;
  const labelTarget = useRef<HTMLSpanElement>(null);
  const status = useSelector(getGitStatus);
  const isOpen = useSelector(showBranchPopupSelector);
  const triggeringAutocommit = useSelector(getIsTriggeringAutocommit);
  const pollingAutocommit = useSelector(getIsPollingAutocommit);
  const isBranchChangeDisabled = triggeringAutocommit || pollingAutocommit;

  const setIsOpen = (isOpen: boolean) => {
    dispatch(setShowBranchPopupAction(isOpen));
  };

  return (
    <Popover2
      content={<BranchList setIsPopupOpen={setIsOpen} />}
      data-testid={"t--git-branch-button-popover"}
      disabled={isBranchChangeDisabled}
      hasBackdrop
      isOpen={isOpen}
      minimal
      modifiers={{ offset: { enabled: true, options: { offset: [7, 10] } } }}
      onInteraction={(nextState: boolean) => {
        setIsOpen(nextState);
        if (nextState) {
          AnalyticsUtil.logEvent("GS_OPEN_BRANCH_LIST_POPUP", {
            source: "BOTTOM_BAR_ACTIVE_BRANCH_NAME",
          });
        }
      }}
      placement="top-start"
    >
      <Tooltip
        content={currentBranch || ""}
        isDisabled={!isEllipsisActive(labelTarget.current)}
        placement="topLeft"
      >
        <ButtonContainer
          className="t--branch-button"
          data-testid={"t--branch-button-currentBranch"}
          isDisabled={isBranchChangeDisabled}
          kind="secondary"
        >
          {isProtectedMode ? (
            <ProtectedIcon
              style={{ height: 14, width: 14, marginRight: 4, marginTop: 1 }}
            />
          ) : (
            <Icon name={"git-branch"} style={{ marginRight: 4 }} />
          )}
          <span
            ref={labelTarget}
            style={{
              maxWidth: "82px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {currentBranch}
          </span>
          {!status?.isClean && !isProtectedMode && "*"}
        </ButtonContainer>
      </Tooltip>
    </Popover2>
  );
}

export default BranchButton;
