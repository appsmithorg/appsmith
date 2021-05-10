import React from "react";
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
}

export const TableIconWrapper = styled.div<{
  selected?: boolean;
  disabled?: boolean;
}>`
  background: ${(props) => (props.selected ? Colors.Gallery : "transparent")};
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  cursor: ${(props) => !props.disabled && "pointer"};
  color: ${(props) => (props.selected ? Colors.CODE_GRAY : Colors.GRAY)};
  .action-title {
    margin-left: 4px;
  }
  position: relative;
  margin-left: 5px;
  padding: 0 5px;
  &:hover {
    background: ${Colors.ATHENS_GRAY};
  }
`;

function TableAction(props: TableActionProps) {
  return (
    <TableIconWrapper
      className={props.className}
      onClick={(e) => {
        props.selectMenu(!props.selected);
        e.stopPropagation();
      }}
      selected={props.selected}
    >
      <IconWrapper
        color={props.selected ? Colors.CODE_GRAY : Colors.GRAY}
        height={20}
        width={20}
      >
        {props.children}
      </IconWrapper>
      <span className="action-title">{props.title}</span>
      {props.icon ? props.icon : null}
    </TableIconWrapper>
  );
}

export default TableAction;
