import React from "react";
import { TooltipComponent as Tooltip } from "design-system";
import { isEllipsisActive } from "utils/helpers";
import { Text, TextType } from "design-system";
import { BranchListItemContainer } from "./BranchListItemContainer";

export function RemoteBranchListItem({ branch, className, onClick }: any) {
  const textRef = React.useRef<HTMLSpanElement>(null);
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
        boundary="window"
        content={branch}
        disabled={!isEllipsisActive(textRef.current)}
        position="top"
      >
        <Text ref={textRef} type={TextType.P1}>
          {branch}
        </Text>
      </Tooltip>
    </BranchListItemContainer>
  );
}
