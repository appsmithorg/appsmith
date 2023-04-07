import React, { useEffect } from "react";
import scrollIntoView from "scroll-into-view-if-needed";
import { BranchListItemContainer } from "./BranchListItemContainer";
import DefaultTag from "./DefaultTag";
import { useHover } from "../hooks";
import BranchMoreMenu from "./BranchMoreMenu";
import { Tooltip, Text } from "design-system";

export function BranchListItem({
  active,
  branch,
  className,
  isDefault,
  onClick,
  selected,
  shouldScrollIntoView,
}: any) {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const [hover] = useHover(itemRef);

  useEffect(() => {
    if (itemRef.current && shouldScrollIntoView) {
      scrollIntoView(itemRef.current, {
        scrollMode: "if-needed",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [shouldScrollIntoView]);

  return (
    <BranchListItemContainer
      active={active}
      className={className}
      data-testid="t--branch-list-item"
      isDefault={isDefault}
      ref={itemRef}
      selected={selected}
    >
      <Tooltip content={branch} placement="top">
        <Text kind={"body-m"} onClick={onClick}>
          {branch}
          {isDefault && <DefaultTag />}
        </Text>
      </Tooltip>
      {hover && <BranchMoreMenu branchName={branch} />}
    </BranchListItemContainer>
  );
}
