import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import { Popover2 } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

import { getCurrentAppGitMetaData } from "@appsmith/selectors/applicationSelectors";
import BranchList from "../components/BranchList";
import { fetchBranchesInit } from "actions/gitSyncActions";
import { getGitStatus } from "selectors/gitSyncSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Button, Tooltip } from "design-system";
import { isEllipsisActive } from "../../../../utils/helpers";

const ButtonContainer = styled(Button)`
  display: flex;
  align-items: center;
  margin: 0 ${(props) => props.theme.spaces[4]}px;
  max-width: 122px;
  min-width: unset !important;
`;

function BranchButton() {
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const currentBranch = gitMetaData?.branchName;
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const fetchBranches = () => dispatch(fetchBranchesInit());
  const labelTarget = useRef<HTMLSpanElement>(null);
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
        content={currentBranch || ""}
        isDisabled={!isEllipsisActive(labelTarget.current)}
        placement="topLeft"
      >
        <ButtonContainer
          className="t--branch-button"
          data-testid={"t--branch-button-currentBranch"}
          kind="secondary"
          startIcon="git-branch"
        >
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
          {!status?.isClean && "*"}
        </ButtonContainer>
      </Tooltip>
    </Popover2>
  );
}

export default BranchButton;
