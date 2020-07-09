import React from "react";
import {
  Popover,
  Classes,
  PopoverInteractionKind,
  Position,
  Icon,
} from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ReactComponent as FilterIcon } from "assets/icons/control/filter-icon.svg";
import { ReactTableColumnProps } from "components/designSystems/appsmith/ReactTableComponent";
import Button from "components/editorComponents/Button";

const TableIconWrapper = styled.div<{ selected: boolean }>`
  background: ${props => (props.selected ? Colors.ATHENS_GRAY : "transparent")};
  box-shadow: ${props =>
    props.selected ? `inset 0px 4px 0px ${Colors.GREEN}` : "none"};
  width: 48px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TableFilerWrapper = styled.div``;

interface TableFilterProps {
  columns: ReactTableColumnProps[];
}

const TableFilters = (props: TableFilterProps) => {
  const [selected, selectMenu] = React.useState(false);
  return (
    <Popover
      minimal
      usePortal
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM}
      onClose={() => {
        selectMenu(false);
      }}
    >
      <TableIconWrapper
        selected={selected}
        onClick={() => {
          selectMenu(true);
        }}
      >
        <IconWrapper
          width={20}
          height={20}
          color={selected ? Colors.OXFORD_BLUE : Colors.CADET_BLUE}
        >
          <FilterIcon />
        </IconWrapper>
      </TableIconWrapper>
      <TableFilerWrapper></TableFilerWrapper>
    </Popover>
  );
};

export default TableFilters;
