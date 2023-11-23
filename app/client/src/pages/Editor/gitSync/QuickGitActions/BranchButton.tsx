import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";

import { Popover2 } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";

import { getCurrentAppGitMetaData } from "@appsmith/selectors/applicationSelectors";
import BranchList from "../components/BranchList";
import {
  getGitStatus,
  protectedModeSelector,
} from "selectors/gitSyncSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Button, Icon, Text, Tooltip } from "design-system";
import { isEllipsisActive } from "../../../../utils/helpers";
import {
  BRANCH_TOOLTIP_MESSAGE,
  BRANCH_TOOLTIP_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import { importRemixIcon } from "design-system-old";

const ProtectedIcon = importRemixIcon(
  async () => import("remixicon-react/ShieldKeyholeLineIcon"),
);

const ButtonContainer = styled(Button)`
  display: flex;
  align-items: center;
  margin: 0 ${(props) => props.theme.spaces[4]}px;
  max-width: 122px;
  min-width: unset !important;
`;

const TooltipText = styled(Text)`
  font-size: 12px;
  color: #fff;
`;

function BranchButton() {
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const isProtectedMode = useSelector(protectedModeSelector);
  const currentBranch = gitMetaData?.branchName;
  const [isOpen, setIsOpen] = useState(false);
  const labelTarget = useRef<HTMLSpanElement>(null);
  const status = useSelector(getGitStatus);
  const [showProtectedBranchTooltip, setShowProtectedBranchTooltip] =
    useState(false);

  useEffect(() => {
    setShowProtectedBranchTooltip(!!isProtectedMode);
  }, [isProtectedMode]);

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
        content={
          <>
            <TooltipText
              renderAs="p"
              style={{ fontWeight: "bold", marginBottom: 16 }}
            >
              {createMessage(BRANCH_TOOLTIP_TITLE)}
            </TooltipText>
            <TooltipText renderAs="p">
              {createMessage(BRANCH_TOOLTIP_MESSAGE)}
            </TooltipText>
          </>
        }
        defaultVisible
        isDisabled={!isProtectedMode || isOpen}
        onVisibleChange={(v) => setShowProtectedBranchTooltip(v)}
        placement="topLeft"
        trigger={["hover", "click"]}
        visible={showProtectedBranchTooltip}
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
      </Tooltip>
    </Popover2>
  );
}

export default BranchButton;
