import React, { useEffect } from "react";
import scrollIntoView from "scroll-into-view-if-needed";
import { BranchListItemContainer } from "./BranchListItemContainer";
import DefaultTag from "./DefaultTag";
import { useHover } from "../hooks";
import BranchMoreMenu from "./BranchMoreMenu";
import { Tooltip, Text, Spinner } from "design-system";
import { isEllipsisActive } from "utils/helpers";
import { useSelector } from "react-redux";
import { getBranchSwitchingDetails } from "selectors/gitSyncSelectors";

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
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);
  const { isSwitchingBranch, switchingToBranch } = useSelector(
    getBranchSwitchingDetails,
  );
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
      onClick={onClick}
      ref={itemRef}
      selected={selected}
    >
      <Tooltip
        content={branch}
        isDisabled={!isEllipsisActive(document.getElementById(branch))}
        placement="top"
      >
        <span className="branch-list-item-text" ref={textRef}>
          <Text
            id={branch}
            kind={"body-m"}
            style={{
              width: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {branch}
          </Text>
          {isDefault && <DefaultTag />}
          {switchingToBranch === branch && isSwitchingBranch && (
            <Spinner size="md" />
          )}
        </span>
      </Tooltip>
      {(hover || isMoreMenuOpen) && (
        <BranchMoreMenu
          branchName={branch}
          open={isMoreMenuOpen}
          setOpen={setIsMoreMenuOpen}
        />
      )}
    </BranchListItemContainer>
  );
}
