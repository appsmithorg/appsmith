import React from "react";
import { Tooltip } from "design-system";
import { isEllipsisActive } from "utils/helpers";
import { Text, TextType } from "design-system-old";
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
    </BranchListItemContainer>
  );
}
