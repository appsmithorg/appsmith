import React, { useEffect } from "react";
import scrollIntoView from "scroll-into-view-if-needed";
import { BranchListItemContainer } from "./BranchListItemContainer";
import { TooltipComponent as Tooltip } from "design-system";
import { isEllipsisActive } from "utils/helpers";
import { Text, TextType } from "design-system";
import DefaultTag from "./DefaultTag";
import { useHover } from "../hooks";
import BranchMoreMenu from "./BranchMoreMenu";

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
  const textRef = React.useRef<HTMLSpanElement>(null);
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
      <Tooltip
        boundary="window"
        content={branch}
        disabled={!isEllipsisActive(textRef.current)}
        position="top"
      >
        <Text onClick={onClick} ref={textRef} type={TextType.P1}>
          {branch}
          {isDefault && <DefaultTag />}
        </Text>
      </Tooltip>
      {hover && <BranchMoreMenu branchName={branch} />}
    </BranchListItemContainer>
  );
}
