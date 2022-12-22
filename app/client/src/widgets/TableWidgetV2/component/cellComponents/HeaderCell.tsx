import React, { createRef, useEffect, useState } from "react";
import { AnyStyledComponent } from "styled-components";
import { MenuItem, Tooltip, Menu } from "@blueprintjs/core";
import Check from "remixicon-react/CheckFillIcon";
import ArrowDownIcon from "remixicon-react/ArrowDownSLineIcon";

import { Colors } from "constants/Colors";
import styled from "constants/DefaultTheme";
import { ControlIcons } from "icons/ControlIcons";
import { CellAlignment, JUSTIFY_CONTENT } from "../Constants";
import { ReactComponent as EditIcon } from "assets/icons/control/edit-variant1.svg";
import { TooltipContentWrapper } from "../TableStyledWrappers";
import { isColumnTypeEditable } from "widgets/TableWidgetV2/widget/utilities";
import { Popover2 } from "@blueprintjs/popover2";
import { MenuDivider } from "design-system";

const AscendingIcon = styled(ControlIcons.SORT_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  top: 3px;
  cursor: pointer;
  transform: rotate(180deg);
  && svg {
    path {
      fill: ${Colors.LIGHT_GREYISH_BLUE};
    }
  }
`;

const DescendingIcon = styled(ControlIcons.SORT_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  top: 3px;
  cursor: pointer;
  && svg {
    path {
      fill: ${Colors.LIGHT_GREYISH_BLUE};
    }
  }
`;

const ColumnNameContainer = styled.div<{
  horizontalAlignment: CellAlignment;
}>`
  display: flex;
  align-items: center;
  justify-content: ${(props) =>
    props?.horizontalAlignment && JUSTIFY_CONTENT[props.horizontalAlignment]};
`;

const StyledEditIcon = styled(EditIcon)`
  width: 14px;
  min-width: 14px;
  margin-right: 3px;
`;

const TitleWrapper = styled.div`
  &,
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

type TitleProps = {
  children: React.ReactNode;
  tableWidth?: number;
  width?: number;
};

function Title(props: TitleProps) {
  const ref = createRef<HTMLDivElement>();
  const [useToolTip, updateToolTip] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (element && element.offsetWidth < element.scrollWidth) {
      updateToolTip(true);
    } else {
      updateToolTip(false);
    }
  }, [ref.current, props.width, props.children]);

  return (
    <TitleWrapper ref={ref}>
      {useToolTip && props.children ? (
        <Tooltip
          autoFocus={false}
          content={
            <TooltipContentWrapper width={(props.tableWidth || 300) - 32}>
              {props.children}
            </TooltipContentWrapper>
          }
          hoverOpenDelay={1000}
          position="top"
        >
          {props.children}
        </Tooltip>
      ) : (
        props.children
      )}
    </TitleWrapper>
  );
}

const ICON_SIZE = 16;

export function HeaderCell(props: {
  canFreezeColumn?: boolean;
  columnName: string;
  columnIndex: number;
  isHidden: boolean;
  isAscOrder?: boolean;
  handleColumnFreeze?: (columnName: string, sticky?: string) => void;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  isResizingColumn: boolean;
  column: any;
  editMode?: boolean;
  isSortable?: boolean;
  width?: number;
}) {
  const { column, editMode, isSortable } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSortColumn = (sortOrder: boolean) => {
    if (props.isResizingColumn) return;
    const columnIndex = props.columnIndex;
    props.sortTableColumn(columnIndex, sortOrder);
  };

  const disableSort = editMode === false && isSortable === false;

  const isColumnEditable =
    column.columnProperties.isCellEditable &&
    column.columnProperties.isEditable &&
    isColumnTypeEditable(column.columnProperties.columnType);

  const toggleColumnFreeze = (value: string) => {
    props.handleColumnFreeze &&
      props.handleColumnFreeze(
        props.column.id,
        props.column.sticky !== value ? value : "",
      );
  };
  return (
    <div
      {...column.getHeaderProps()}
      className="th header-reorder"
      data-header={props.columnName}
    >
      <div className={!props.isHidden ? `draggable-header` : "hidden-header"}>
        <ColumnNameContainer
          horizontalAlignment={column.columnProperties.horizontalAlignment}
        >
          {isColumnEditable && <StyledEditIcon />}
          <Title width={props.width}>
            {props.columnName.replace(/\s/g, "\u00a0")}
          </Title>
        </ColumnNameContainer>
      </div>
      <div className="header-menu">
        <Popover2
          content={
            <Menu>
              <MenuItem
                disabled={disableSort}
                labelElement={props.isAscOrder === true ? <Check /> : undefined}
                onClick={() => {
                  handleSortColumn(true);
                }}
                text="Sort column ascending"
              />
              <MenuItem
                disabled={disableSort}
                labelElement={
                  props.isAscOrder === false ? <Check /> : undefined
                }
                onClick={() => {
                  handleSortColumn(false);
                }}
                text="Sort column descending"
              />
              <MenuDivider />
              <MenuItem
                disabled={!props.canFreezeColumn}
                labelElement={column.sticky === "left" ? <Check /> : undefined}
                onClick={() => {
                  toggleColumnFreeze("left");
                }}
                text="Freeze column left"
              />
              <MenuItem
                disabled={!props.canFreezeColumn}
                labelElement={column.sticky === "right" ? <Check /> : undefined}
                onClick={() => {
                  toggleColumnFreeze("right");
                }}
                text="Freeze column right"
              />
            </Menu>
          }
          interactionKind="click"
          isOpen={isMenuOpen}
          onInteraction={(state: any) => {
            setIsMenuOpen(state);
          }}
          placement="bottom-end"
        >
          <ArrowDownIcon className="w-5 h-5" color="var(--wds-color-icon)" />
        </Popover2>
      </div>
      {props.isAscOrder !== undefined ? (
        <div>
          {props.isAscOrder ? (
            <AscendingIcon height={ICON_SIZE} width={ICON_SIZE} />
          ) : (
            <DescendingIcon height={ICON_SIZE} width={ICON_SIZE} />
          )}
        </div>
      ) : null}
      <div
        {...column.getResizerProps()}
        className={`resizer ${column.isResizing ? "isResizing" : ""}`}
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
    </div>
  );
}
