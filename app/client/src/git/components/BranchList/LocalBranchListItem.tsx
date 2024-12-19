import React, { useCallback, useEffect } from "react";
import scrollIntoView from "scroll-into-view-if-needed";
import BranchListItemContainer from "./BranchListItemContainer";
import useHover from "./hooks/useHover";
import BranchMoreMenu from "./BranchMoreMenu";
import { Tooltip, Text, Spinner, Tag, Icon } from "@appsmith/ads";
import { isEllipsisActive } from "utils/helpers";
import styled from "styled-components";
import noop from "lodash/noop";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const StyledIcon = styled(Icon)`
  margin-right: 8px;
  width: 14px;
  height: 14px;
  margin-top: 1px;
`;

const OptionsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
`;

const BranchText = styled(Text)`
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface LocalBranchListItemProps {
  branch: string;
  checkoutBranch: (branch: string) => void;
  checkoutDestBranch: string | null;
  className?: string;
  currentBranch: string | null;
  defaultBranch: string | null;
  deleteBranch: (branch: string) => void;
  isActive: boolean;
  isCheckoutBranchLoading: boolean;
  isDefault: boolean;
  isProtected: boolean;
  isSelected: boolean;
  shouldScrollIntoView: boolean;
}

export default function LocalBranchListItem({
  branch,
  checkoutBranch = noop,
  checkoutDestBranch = null,
  className,
  currentBranch = null,
  defaultBranch = null,
  deleteBranch = noop,
  isActive = false,
  isCheckoutBranchLoading = false,
  isDefault = false,
  isProtected = false,
  isSelected = false,
  shouldScrollIntoView = false,
}: LocalBranchListItemProps) {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const [hover] = useHover(itemRef);
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);

  useEffect(
    function scrollIntoViewOnInitEffect() {
      if (itemRef.current && shouldScrollIntoView) {
        scrollIntoView(itemRef.current, {
          scrollMode: "if-needed",
          block: "nearest",
          inline: "nearest",
        });
      }
    },
    [shouldScrollIntoView],
  );

  const handleClickOnBranch = useCallback(() => {
    checkoutBranch(branch);
    AnalyticsUtil.logEvent("GS_SWITCH_BRANCH", {
      source: "BRANCH_LIST_POPUP_FROM_BOTTOM_BAR",
    });
  }, [branch, checkoutBranch]);

  return (
    <BranchListItemContainer
      className={className}
      data-testid="t--branch-list-item"
      isActive={isActive}
      isDefault={isDefault}
      isSelected={isSelected}
      onClick={handleClickOnBranch}
      ref={itemRef}
    >
      {isProtected && <StyledIcon name="protected-icon" />}
      <Tooltip
        content={branch}
        isDisabled={
          !isEllipsisActive(document.getElementById(`branch-text-${branch}`))
        }
        placement="top"
      >
        <span className="branch-list-item-text" ref={textRef}>
          <BranchText id={`branch-text-${branch}`} kind={"body-m"}>
            {branch}
          </BranchText>
          {isDefault && (
            <Tag data-testid="t--default-tag" isClosable={false} size="sm">
              Default
            </Tag>
          )}
        </span>
      </Tooltip>
      <OptionsContainer>
        {checkoutDestBranch === branch && isCheckoutBranchLoading && (
          <Spinner size="md" />
        )}
        {(hover || isMoreMenuOpen) && (
          <BranchMoreMenu
            branch={branch}
            currentBranch={currentBranch}
            defaultBranch={defaultBranch}
            deleteBranch={deleteBranch}
            open={isMoreMenuOpen}
            setOpen={setIsMoreMenuOpen}
          />
        )}
      </OptionsContainer>
    </BranchListItemContainer>
  );
}
