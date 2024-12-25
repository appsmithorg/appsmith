import { Button, Icon, Tooltip } from "@appsmith/ads";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import noop from "lodash/noop";
import BranchList from "../BranchList";
import { Popover2 } from "@blueprintjs/popover2";

// internal dependencies
import { isEllipsisActive } from "utils/helpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

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

const BranchButtonIcon = styled(Icon)`
  margin-right: 4px;
`;

const BranchButtonLabel = styled.span`
  max-width: 82px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const popoverModifiers: { offset: Record<string, unknown> } = {
  offset: { enabled: true, options: { offset: [7, 10] } },
};

interface BranchButtonProps {
  currentBranch: string | null;
  isAutocommitPolling: boolean;
  isBranchPopupOpen: boolean;
  isProtectedMode: boolean;
  isStatusClean: boolean;
  isTriggerAutocommitLoading: boolean;
  toggleBranchPopup: (open: boolean) => void;
}

export default function BranchButton({
  currentBranch = null,
  isAutocommitPolling = false,
  isBranchPopupOpen = false,
  isProtectedMode = false,
  isStatusClean = false,
  isTriggerAutocommitLoading = false,
  toggleBranchPopup = noop,
}: BranchButtonProps) {
  const labelTarget = React.useRef<HTMLSpanElement>(null);

  const isDisabled = isTriggerAutocommitLoading || isAutocommitPolling;

  const onPopoverInteraction = useCallback(
    (nextState: boolean) => {
      toggleBranchPopup(nextState);

      if (nextState) {
        AnalyticsUtil.logEvent("GS_OPEN_BRANCH_LIST_POPUP", {
          source: "BOTTOM_BAR_ACTIVE_BRANCH_NAME",
        });
      }
    },
    [toggleBranchPopup],
  );

  const content = useMemo(() => {
    return <BranchList />;
  }, []);

  return (
    <Popover2
      content={content}
      data-testid={"t--git-branch-button-popover"}
      disabled={isDisabled}
      hasBackdrop
      isOpen={isBranchPopupOpen}
      minimal
      modifiers={popoverModifiers}
      onInteraction={onPopoverInteraction}
      placement="top-start"
    >
      <Tooltip
        content={currentBranch}
        isDisabled={!isEllipsisActive(labelTarget.current)}
        placement="topLeft"
      >
        <ButtonContainer
          data-testid={"t--git-quick-actions-branch"}
          isDisabled={isDisabled}
          kind="secondary"
        >
          {isProtectedMode ? (
            <BranchButtonIcon name="protected-icon" />
          ) : (
            <BranchButtonIcon name="git-branch" />
          )}
          <BranchButtonLabel ref={labelTarget}>
            {currentBranch}
          </BranchButtonLabel>
          {!isStatusClean && !isProtectedMode && "*"}
        </ButtonContainer>
      </Tooltip>
    </Popover2>
  );
}
