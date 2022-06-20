import React from "react";
import Tooltip from "components/ads/Tooltip";
import { isEllipsisActive } from "utils/helpers";
import { Position } from "@blueprintjs/core";
import Text, { TextType } from "components/ads/Text";
import { BranchListItemContainer } from "./BranchListItemContainer";

export function RemoteBranchListItem({ branch, className, onClick }: any) {
  const textRef = React.useRef<HTMLSpanElement>(null);
  return (
    <BranchListItemContainer
      active={false}
      className={className}
      data-testid={`t--git-${className}`}
      isDefault={false}
      onClick={onClick}
      ref={null}
      selected={false}
    >
      <Tooltip
        boundary="window"
        content={branch}
        disabled={!isEllipsisActive(textRef.current)}
        position={Position.TOP}
      >
        <Text ref={textRef} type={TextType.P1}>
          {branch}
        </Text>
      </Tooltip>
    </BranchListItemContainer>
  );
}
