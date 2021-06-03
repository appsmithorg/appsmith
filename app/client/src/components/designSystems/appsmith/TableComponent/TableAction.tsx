import React, { useCallback } from "react";
import { IconWrapper } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import styled from "styled-components";

interface TableActionProps {
  selected: boolean;
  selectMenu: (selected: boolean) => void;
  className: string;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  filterApplied?: boolean;
}

export const TableIconWrapper = styled.div<{
  selected?: boolean;
  disabled?: boolean;
  filterApplied?: boolean;
}>`
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  cursor: ${(props) => !props.disabled && "pointer"};
  color: ${(props) => (props.selected ? Colors.CODE_GRAY : Colors.GRAY)};
  .action-title {
    margin-left: 4px;
    white-space: nowrap;
    color: ${(props) => (props.filterApplied ? Colors.CODE_GRAY : Colors.GRAY)};
  }
  position: relative;
  margin-left: 5px;
  padding: 0 5px;
  &:hover {
    background: ${Colors.ATHENS_GRAY};
  }
`;

function TableAction(props: TableActionProps) {
  const handleIconClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      props.selectMenu(!props.selected);
      e.stopPropagation();
    },
    [props.selected],
  );
  return (
    <TableIconWrapper
      className={props.className}
      filterApplied={props.filterApplied}
      onClick={handleIconClick}
      selected={props.selected}
    >
      <IconWrapper
        color={props.filterApplied ? Colors.CODE_GRAY : Colors.GRAY}
        height={20}
        width={20}
      >
        {props.children}
      </IconWrapper>
      <span className="action-title">{props.title}</span>
    </TableIconWrapper>
  );
}

export default TableAction;
