import React, { useEffect } from "react";
import scrollIntoView from "scroll-into-view-if-needed";
import { BranchListItemContainer } from "./BranchListItemContainer";
import DefaultTag from "./DefaultTag";
import { useHover } from "../hooks";
import BranchMoreMenu from "./BranchMoreMenu";
import { Tooltip, Text, Spinner } from "@appsmith/ads";
import { isEllipsisActive } from "utils/helpers";
import { useSelector } from "react-redux";
import { getBranchSwitchingDetails } from "selectors/gitSyncSelectors";
import styled from "styled-components";
import { importRemixIcon } from "@appsmith/ads-old";

const ProtectedIcon = importRemixIcon(
  async () => import("remixicon-react/ShieldKeyholeLineIcon"),
);

const OptionsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
`;

export function BranchListItem({
  active,
  branch,
  className,
  isDefault,
  isProtected,
  onClick,
  selected,
  shouldScrollIntoView, // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      {isProtected && (
        <ProtectedIcon
          style={{ marginRight: 8, width: 14, height: 14, marginTop: 1 }}
        />
      )}
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
        </span>
      </Tooltip>
      <OptionsContainer>
        {switchingToBranch === branch && isSwitchingBranch && (
          <Spinner size="md" />
        )}
        {(hover || isMoreMenuOpen) && (
          <BranchMoreMenu
            branchName={branch}
            open={isMoreMenuOpen}
            setOpen={setIsMoreMenuOpen}
          />
        )}
      </OptionsContainer>
    </BranchListItemContainer>
  );
}
