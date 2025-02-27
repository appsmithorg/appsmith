import type { Key } from "react";
import React, { useCallback, memo } from "react";

import { MULTISELECT_CHECKBOX_WIDTH, StickyType } from "../Constants";
import { isColumnTypeEditable } from "widgets/wds/WDSTableWidget/widget/utilities";
import {
  Flex,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuTrigger,
  Text,
} from "@appsmith/wds";

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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  excludeFromTabOrder?: boolean;
}

const HeaderCellComponent = (props: HeaderProps) => {
  const { column, isSortable } = props;

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

  const disableSort = isSortable === false;

  const isColumnEditable =
    column.columnProperties.isCellEditable &&
    column.columnProperties.isEditable &&
    isColumnTypeEditable(column.columnProperties.columnType);

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
      default:
        break;
    }
  };

  return (
    <th
      {...headerProps}
      aria-hidden={props.isHidden ? "true" : undefined}
      className={`th header-reorder justify-end ${props.stickyRightModifier}`}
      data-header={props.columnName}
    >
      <div
        className={!props.isHidden ? `draggable-header` : "hidden-header"}
        data-draggable-header=""
        draggable={
          (props.column.sticky === StickyType.NONE && !props.isHidden) ||
          undefined
        }
        onClick={!disableSort ? handleSortColumn : undefined}
        onDrag={props.onDrag}
        onDragEnd={props.onDragEnd}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDragStart={onDragStart}
        onDrop={onDrop}
        style={
          {
            "--padding-inline-end": isSortable
              ? props.isAscOrder !== undefined
                ? "calc((var(--outer-spacing-2) * 2) + (2 *var(--sizing-7)))"
                : "calc((var(--outer-spacing-2) * 2) + var(--sizing-7))"
              : "calc(var(--outer-spacing-2) * 2)",
            justifyContent: column.columnProperties.horizontalAlignment,
          } as React.CSSProperties
        }
      >
        <Flex alignItems="center" gap="spacing-1">
          {isColumnEditable && <Icon name="edit" size="small" />}
          <Text
            lineClamp={1}
            size="caption"
            title={props.columnName.replace(/\s/g, "\u00a0")}
          >
            {props.columnName.replace(/\s/g, "\u00a0")}
          </Text>
        </Flex>
      </div>
      {isSortable && (
        <Flex alignItems="center" gap="spacing-1">
          {props.isAscOrder !== undefined && (
            <span style={{ pointerEvents: "none" }}>
              <Icon
                name={props.isAscOrder ? "arrow-up" : "arrow-down"}
                size="small"
              />
            </span>
          )}
          <MenuTrigger>
            <IconButton
              color="neutral"
              excludeFromTabOrder={props.excludeFromTabOrder}
              icon="chevron-down"
              size="small"
              variant="ghost"
            />
            <Menu onAction={onActionOnMenu}>
              {[
                { id: "sort-asc", label: "Sort column ascending" },
                { id: "sort-desc", label: "Sort column descending" },
              ].map((item) => (
                <MenuItem key={item.id} textValue={item.label}>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </MenuTrigger>
        </Flex>
      )}
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
