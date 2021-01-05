import React from "react";
import { Tooltip } from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import { TableIconWrapper } from "components/designSystems/appsmith/TableStyledWrappers";

interface TableActionIconProps {
  tooltip: string;
  selected: boolean;
  selectMenu: (selected: boolean) => void;
  className: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const TableActionIcon = (props: TableActionIconProps) => {
  return (
    <Tooltip
      autoFocus={false}
      hoverOpenDelay={1000}
      content={props.tooltip}
      position="top"
      modifiers={{
        preventOverflow: { enabled: false },
        flip: { enabled: false },
      }}
    >
      <TableIconWrapper
        selected={props.selected}
        onClick={(e) => {
          props.selectMenu(!props.selected);
          e.stopPropagation();
        }}
        className={props.className}
      >
        <IconWrapper
          width={20}
          height={20}
          color={props.selected ? Colors.OXFORD_BLUE : Colors.CADET_BLUE}
        >
          {props.children}
        </IconWrapper>
        {props.icon ? props.icon : null}
      </TableIconWrapper>
    </Tooltip>
  );
};

export default TableActionIcon;
