import type { Key } from "react";
import React, { useCallback, memo } from "react";

import { MULTISELECT_CHECKBOX_WIDTH, StickyType } from "../Constants";
import { isColumnTypeEditable } from "widgets/wds/WDSTableWidget/widget/utilities";
import {
  Flex,
  Icon,
  IconButton,
  Item,
  Menu,
  MenuList,
  Text,
} from "@design-system/widgets";

interface HeaderProps {
  canFreezeColumn?: boolean;
  columnName: string;
  columnIndex: number;
  isHidden: boolean;
  isAscOrder?: boolean;
  handleColumnFreeze?: (columnName: string, sticky?: StickyType) => void;
  handleReorderColumn: (columnOrder: string[]) => void;
  columnOrder?: string[];
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  isResizingColumn: boolean;
  column: any;
  editMode?: boolean;
  isSortable?: boolean;
  width?: number;
  widgetId: string;
  stickyRightModifier: string;
  multiRowSelection?: boolean;
  onDrag: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (
    e: React.DragEvent<HTMLDivElement>,
    destinationIndex: number,
  ) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (
    e: React.DragEvent<HTMLDivElement>,
    destinationIndex: number,
  ) => void;
}

const HeaderCellComponent = (props: HeaderProps) => {
  const { column, editMode, isSortable } = props;

  const headerProps = { ...column.getHeaderProps() };
  headerProps["style"] = {
    ...headerProps.style,
    display: "flex",
    left:
      column.sticky === StickyType.LEFT && props.multiRowSelection
        ? MULTISELECT_CHECKBOX_WIDTH + column.totalLeft
        : headerProps.style.left,
  };
  const handleSortColumn = () => {
    if (props.isResizingColumn) return;
    let columnIndex = props.columnIndex;
    if (props.isAscOrder === true) {
      columnIndex = -1;
    }
    const sortOrder =
      props.isAscOrder === undefined ? false : !props.isAscOrder;
    props.sortTableColumn(columnIndex, sortOrder);
  };

  const disableSort = editMode === false && isSortable === false;

  const isColumnEditable =
    column.columnProperties.isCellEditable &&
    column.columnProperties.isEditable &&
    isColumnTypeEditable(column.columnProperties.columnType);

  const toggleColumnFreeze = (value: StickyType) => {
    props.handleColumnFreeze &&
      props.handleColumnFreeze(
        props.column.id,
        props.column.sticky !== value ? value : StickyType.NONE,
      );
  };

  const onDragStart = useCallback(
    (e) => {
      props.onDragStart(e, props.columnIndex);
    },
    [props.columnIndex, props.onDragStart],
  );
  const onDragEnter = useCallback(
    (e) => {
      if (props.column.sticky === StickyType.NONE && !props.isHidden) {
        props.onDragEnter(e, props.columnIndex);
      }
    },
    [props.onDragEnter, props.column.sticky, props.columnIndex, props.isHidden],
  );

  const onDragLeave = useCallback(
    (e) => {
      if (props.column.sticky === StickyType.NONE && !props.isHidden) {
        props.onDragLeave(e);
      }
    },
    [props.onDragLeave, props.column.sticky, props.isHidden],
  );

  const onDragOver = useCallback(
    (e) => {
      // Below condition will disable the ability to drop a column on a frozen column
      if (props.column.sticky === StickyType.NONE && !props.isHidden) {
        props.onDragOver(e, props.columnIndex);
      }
    },
    [props.onDragOver, props.column.sticky, props.columnIndex, props.isHidden],
  );

  const onDrop = useCallback(
    (e) => {
      props.onDrop(e, props.columnIndex);
    },
    [props.onDrop, props.columnIndex],
  );

  const onActionOnMenu = (key: Key) => {
    switch (key) {
      case "sort-asc":
        props.sortTableColumn(props.columnIndex, true);
        break;
      case "sort-desc":
        props.sortTableColumn(props.columnIndex, false);
        break;
      case "freeze-left":
        toggleColumnFreeze(StickyType.LEFT);
        break;
      case "freeze-right":
        toggleColumnFreeze(StickyType.RIGHT);
        break;
      default:
        break;
    }
  };

  return (
    <th
      {...headerProps}
      aria-hidden={props.isHidden ? "true" : undefined}
      className={`th header-reorder ${props.stickyRightModifier}`}
      data-header={props.columnName}
    >
      <div
        className={!props.isHidden ? `draggable-header` : "hidden-header"}
        data-draggable-header=""
        draggable={
          (props.column.sticky === StickyType.NONE && !props.isHidden) ||
          undefined
        }
        onClick={!disableSort && props ? handleSortColumn : undefined}
        onDrag={props.onDrag}
        onDragEnd={props.onDragEnd}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDragStart={onDragStart}
        onDrop={onDrop}
        style={
          {
            "--padding-inline-end": props.isAscOrder
              ? "calc((var(--outer-spacing-2) * 2) + (2 *var(--sizing-7)))"
              : "calc((var(--outer-spacing-2) * 2) + var(--sizing-7))",
          } as React.CSSProperties
        }
      >
        <Flex
          alignItems="center"
          gap="spacing-1"
          justifyContent={column.columnProperties.horizontalAlignment}
        >
          {isColumnEditable && <Icon name="edit" size="small" />}
          <Text
            lineClamp={1}
            title={props.columnName.replace(/\s/g, "\u00a0")}
            variant="caption"
          >
            {props.columnName.replace(/\s/g, "\u00a0")}
          </Text>
        </Flex>
      </div>
      <Flex alignItems="center" gap="spacing-1">
        {props.isAscOrder !== undefined && (
          <Icon
            name={props.isAscOrder ? "arrow-up" : "arrow-down"}
            size="small"
          />
        )}
        <Menu disabledKeys={["separator"]} onAction={onActionOnMenu}>
          <IconButton
            color="neutral"
            icon="chevron-down"
            size="small"
            variant="ghost"
          />
          <MenuList>
            <Item key="sort-asc">Sort column ascending</Item>
            <Item key="sort-desc">Sort column descending</Item>
            <Item isSeparator key="separator">
              Separator
            </Item>
            <Item key="freeze-left">Freeze column left</Item>
            <Item key="freeze-right">Freeze column right</Item>
          </MenuList>
        </Menu>
      </Flex>
      <div
        {...column.getResizerProps()}
        data-resizor=""
        data-status={column.isResizing ? "resizing" : ""}
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
    </th>
  );
};
export const HeaderCell = memo(HeaderCellComponent);
