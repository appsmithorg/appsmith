import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import { Popover2 } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

import { Colors } from "constants/Colors";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import BranchList from "../components/BranchList";
import { fetchBranchesInit } from "actions/gitSyncActions";
import {
  getTypographyByKey,
  TooltipComponent as Tooltip,
} from "design-system-old";
import { isEllipsisActive } from "utils/helpers";
import { getGitStatus } from "selectors/gitSyncSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Button } from "design-system";

const ButtonContainer = styled(Button)`
  display: flex;
  align-items: center;
  margin: 0 ${(props) => props.theme.spaces[4]}px;
`;

function BranchButton() {
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const currentBranch = gitMetaData?.branchName;
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const fetchBranches = () => dispatch(fetchBranchesInit());
  const labelTarget = useRef<HTMLButtonElement>(null);
  const status = useSelector(getGitStatus);

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <Popover2
      content={<BranchList setIsPopupOpen={setIsOpen} />}
      data-testid={"t--git-branch-button-popover"}
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
        boundary="window"
        content={currentBranch || ""}
        disabled={!isEllipsisActive(labelTarget.current)}
        hoverOpenDelay={1}
        position="top-left"
      >
        <ButtonContainer
          className="t--branch-button t--branch-button-currentBranch"
          data-testid={"t--branch-button-container"}
          ref={labelTarget}
          startIcon="git-branch"
        >
          {currentBranch}
          {!status?.isClean && "*"}
        </ButtonContainer>
      </Tooltip>
    </Popover2>
  );
}

export default BranchButton;
