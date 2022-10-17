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
  borderRadius?: string;
}

export const TableIconWrapper = styled.div<{
  selected?: boolean;
  disabled?: boolean;
  titleColor?: string;
  borderRadius?: string;
}>`
  height: calc(100% - 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wds-color-bg);
  border-radius: ${(props) => props.borderRadius || "0"};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  cursor: ${(props) => !props.disabled && "pointer"};
  color: ${(props) => (props.selected ? Colors.CODE_GRAY : Colors.GRAY)};
  .action-title {
    margin-left: 4px;
    white-space: nowrap;
    color: ${(props) => props.titleColor || Colors.GRAY};
  }
  position: relative;
  margin-left: 8px;
  padding: 0 6px;
  &:hover {
    background: var(--wds-color-bg-hover);
  }

  & > div {
    width: 16px;
  }

  span {
    font-size: 13px;
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
      borderRadius={props.borderRadius}
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
