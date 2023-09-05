import React from "react";
import { Spinner, Tooltip } from "design-system";
import { isEllipsisActive } from "utils/helpers";
import { Text, TextType } from "design-system-old";
import { BranchListItemContainer } from "./BranchListItemContainer";
import { useSelector } from "react-redux";
import { getBranchSwitchingDetails } from "selectors/gitSyncSelectors";
import styled from "styled-components";

const OptionsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
`;

export function RemoteBranchListItem({ branch, className, onClick }: any) {
  const textRef = React.useRef<HTMLSpanElement>(null);
  const { isSwitchingBranch, switchingToBranch } = useSelector(
    getBranchSwitchingDetails,
  );
  return (
    <BranchListItemContainer
      active={false}
      className={className}
      data-testid="t--branch-list-item"
      isDefault={false}
      onClick={onClick}
      ref={null}
      selected={false}
    >
      <Tooltip
        content={branch}
        isDisabled={!isEllipsisActive(document.getElementById(branch))}
        placement="top"
      >
        <Text
          id={branch}
          ref={textRef}
          style={{
            width: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          type={TextType.P1}
        >
          {branch}
        </Text>
      </Tooltip>
      <OptionsContainer>
        {switchingToBranch === branch && isSwitchingBranch && (
          <Spinner size="md" />
        )}
      </OptionsContainer>
    </BranchListItemContainer>
  );
}
