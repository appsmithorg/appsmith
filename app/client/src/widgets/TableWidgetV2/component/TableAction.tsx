import React, { useCallback } from "react";
import { IconWrapper } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import { ReactComponent as FilterIcon } from "assets/icons/control/filter-icon.svg";
import { ReactComponent as DownloadIcon } from "assets/icons/control/download-data-icon.svg";

interface TableActionProps {
  selected: boolean;
  selectMenu: (selected: boolean) => void;
  className: string;
  icon: string;
  title: string;
  titleColor?: string;
}

export const TableIconWrapper = styled.div<{
  selected?: boolean;
  disabled?: boolean;
  titleColor?: string;
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
    color: ${(props) => props.titleColor || Colors.GRAY};
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

  const getIcon = () => {
    switch (props.icon) {
      case "download":
        return <DownloadIcon />;
      case "filter":
        return <FilterIcon />;
    }
  };

  return (
    <TableIconWrapper
      className={props.className}
      onClick={handleIconClick}
      selected={props.selected}
      titleColor={props.titleColor}
    >
      <IconWrapper
        color={props.titleColor ? props.titleColor : Colors.GRAY}
        height={20}
        width={20}
      >
        {getIcon()}
      </IconWrapper>
      <span className="action-title">{props.title}</span>
    </TableIconWrapper>
  );
}

export default TableAction;
