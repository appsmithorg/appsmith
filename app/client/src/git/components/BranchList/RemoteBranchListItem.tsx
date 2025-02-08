import React, { useCallback } from "react";
import { Spinner, Tooltip } from "@appsmith/ads";
import { isEllipsisActive } from "utils/helpers";
import { Text, TextType } from "@appsmith/ads-old";
import BranchListItemContainer from "./BranchListItemContainer";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import noop from "lodash/noop";

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

interface RemoteBranchListItemProps {
  branch: string;
  checkoutBranch: (branch: string) => void;
  checkoutDestBranch: string | null;
  className?: string;
  isCheckoutBranchLoading: boolean;
}

export default function RemoteBranchListItem({
  branch,
  checkoutBranch = noop,
  checkoutDestBranch = null,
  className,
  isCheckoutBranchLoading = false,
}: RemoteBranchListItemProps) {
  const textRef = React.useRef<HTMLSpanElement>(null);

  const handleClickOnBranch = useCallback(() => {
    checkoutBranch(branch);
    AnalyticsUtil.logEvent("GS_SWITCH_BRANCH", {
      source: "BRANCH_LIST_POPUP_FROM_BOTTOM_BAR",
    });
  }, [branch, checkoutBranch]);

  return (
    <BranchListItemContainer
      className={className}
      data-testid="t--git-branch-item"
      isActive={false}
      isDefault={false}
      isSelected={false}
      onClick={handleClickOnBranch}
      ref={null}
    >
      <Tooltip
        content={branch}
        isDisabled={!isEllipsisActive(document.getElementById(branch))}
        placement="top"
      >
        <BranchText id={branch} ref={textRef} type={TextType.P1}>
          {branch}
        </BranchText>
      </Tooltip>
      <OptionsContainer>
        {checkoutDestBranch === branch && isCheckoutBranchLoading && (
          <Spinner size="md" />
        )}
      </OptionsContainer>
    </BranchListItemContainer>
  );
}
