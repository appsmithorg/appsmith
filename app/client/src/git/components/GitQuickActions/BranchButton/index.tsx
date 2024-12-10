import { Button, Icon, Tooltip } from "@appsmith/ads";
import React, { useCallback } from "react";
import styled from "styled-components";
import noop from "lodash/noop";
import BranchList from "./BranchList";
import { Popover2 } from "@blueprintjs/popover2";

// internal dependencies
import { isEllipsisActive } from "utils/helpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

interface BranchButtonProps {
  currentBranch?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  isDisabled?: boolean;
  isProtectedMode?: boolean;
  isStatusClean?: boolean;
}

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

export default function BranchButton({
  currentBranch = "",
  isDisabled = false,
  isOpen = false,
  isProtectedMode = false,
  isStatusClean = false,
  setIsOpen = noop,
}: BranchButtonProps) {
  const labelTarget = React.useRef<HTMLSpanElement>(null);

  const onPopoverInteraction = useCallback(
    (nextState: boolean) => {
      setIsOpen(nextState);

      if (nextState) {
        AnalyticsUtil.logEvent("GS_OPEN_BRANCH_LIST_POPUP", {
          source: "BOTTOM_BAR_ACTIVE_BRANCH_NAME",
        });
      }
    },
    [setIsOpen],
  );

  const renderContent = useCallback(() => {
    return <BranchList />;
  }, []);

  return (
    <Popover2
      content={renderContent()}
      data-testid={"t--git-branch-button-popover"}
      disabled={isDisabled}
      hasBackdrop
      isOpen={isOpen}
      minimal
      modifiers={popoverModifiers}
      onInteraction={onPopoverInteraction}
      placement="top-start"
    >
      <Tooltip
        content={currentBranch}
        // eslint-disable-next-line react-compiler/react-compiler
        isDisabled={!isEllipsisActive(labelTarget.current)}
        placement="topLeft"
      >
        <ButtonContainer
          className="t--branch-button"
          data-testid={"t--branch-button-currentBranch"}
          isDisabled={isDisabled}
          kind="secondary"
        >
          {isProtectedMode ? (
            <BranchButtonIcon name="protected-icon" />
          ) : (
            <BranchButtonIcon name={"git-branch"} />
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
