import React from "react";
import { Tooltip } from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import { TableIconWrapper } from "./TableStyledWrappers";

interface TableActionIconProps {
  tooltip: string;
  selected: boolean;
  selectMenu: (selected: boolean) => void;
  className: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function TableActionIcon(props: TableActionIconProps) {
  return (
    <Tooltip
      autoFocus={false}
      content={props.tooltip}
      hoverOpenDelay={1000}
      modifiers={{
        preventOverflow: { enabled: false },
        flip: { enabled: false },
      }}
      position="top"
    >
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
      </TableIconWrapper>
    </Tooltip>
  );
}

export default TableActionIcon;
