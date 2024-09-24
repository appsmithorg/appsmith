import React, {
  createRef,
  useCallback,
  useEffect,
  useState,
  memo,
} from "react";
import { MenuItem, Tooltip, Menu } from "@blueprintjs/core";

import { Colors } from "constants/Colors";
import styled from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
import type { CellAlignment } from "../Constants";
import {
  HEADER_MENU_PORTAL_CLASS,
  JUSTIFY_CONTENT,
  MENU_CONTENT_CLASS,
  MULTISELECT_CHECKBOX_WIDTH,
  POPOVER_ITEMS_TEXT_MAP,
  StickyType,
} from "../Constants";
import { TooltipContentWrapper } from "../TableStyledWrappers";
import { isColumnTypeEditable } from "widgets/TableWidgetV2/widget/utilities";
import { Popover2 } from "@blueprintjs/popover2";
import { MenuDivider } from "@design-system/widgets-old";
import { importRemixIcon, importSvg } from "@design-system/widgets-old";
import { CANVAS_ART_BOARD } from "constants/componentClassNameConstants";

const Check = importRemixIcon(
  async () => import("remixicon-react/CheckFillIcon"),
);
const ArrowDownIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowDownSLineIcon"),
);
const EditIcon = importSvg(
  async () => import("assets/icons/control/edit-variant1.svg"),
);

const AscendingIcon = styled(ControlIcons.SORT_CONTROL)`
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

const DescendingIcon = styled(ControlIcons.SORT_CONTROL)`
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

interface TitleProps {
  children: React.ReactNode;
  tableWidth?: number;
  width?: number;
}

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
}

const HeaderCellComponent = (props: HeaderProps) => {
  const { column, editMode, isSortable } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const headerProps = { ...column.getHeaderProps() };

  headerProps["style"] = {
    ...headerProps.style,
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

  return (
    <div
      {...headerProps}
      className={`th header-reorder ${props.stickyRightModifier}`}
      data-header={props.columnName}
    >
      <div
        className={!props.isHidden ? `draggable-header` : "hidden-header"}
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
      >
        <ColumnNameContainer
          horizontalAlignment={column.columnProperties.horizontalAlignment}
        >
          {isColumnEditable && <StyledEditIcon />}
          <Title width={props.width}>
            {props.columnName.replace(/\s/g, "\u00a0")}
          </Title>
        </ColumnNameContainer>
      </div>
      <div
        className={`header-menu ${
          !isSortable && !props.canFreezeColumn && "hide-menu"
        } ${!isMenuOpen && "hide"}`}
      >
        <Popover2
          content={
            <Menu className={MENU_CONTENT_CLASS}>
              <MenuItem
                disabled={disableSort}
                labelElement={props.isAscOrder === true ? <Check /> : undefined}
                onClick={() => {
                  props.sortTableColumn(props.columnIndex, true);
                }}
                text={POPOVER_ITEMS_TEXT_MAP.SORT_ASC}
              />
              <MenuItem
                disabled={disableSort}
                labelElement={
                  props.isAscOrder === false ? <Check /> : undefined
                }
                onClick={() => {
                  props.sortTableColumn(props.columnIndex, false);
                }}
                text={POPOVER_ITEMS_TEXT_MAP.SORT_DSC}
              />
              <MenuDivider
                style={{
                  marginLeft: 0,
                  marginRight: 0,
                }}
              />
              <MenuItem
                disabled={!props.canFreezeColumn}
                labelElement={
                  column.sticky === StickyType.LEFT ? <Check /> : undefined
                }
                onClick={() => {
                  toggleColumnFreeze(StickyType.LEFT);
                }}
                text={POPOVER_ITEMS_TEXT_MAP.FREEZE_LEFT}
              />
              <MenuItem
                disabled={!props.canFreezeColumn}
                labelElement={
                  column.sticky === StickyType.RIGHT ? <Check /> : undefined
                }
                onClick={() => {
                  toggleColumnFreeze(StickyType.RIGHT);
                }}
                text={POPOVER_ITEMS_TEXT_MAP.FREEZE_RIGHT}
              />
            </Menu>
          }
          interactionKind="hover"
          isOpen={isMenuOpen}
          minimal
          onInteraction={setIsMenuOpen}
          placement="bottom-end"
          portalClassName={`${HEADER_MENU_PORTAL_CLASS}-${props.widgetId}`}
          portalContainer={
            document.getElementById(CANVAS_ART_BOARD) || undefined
          }
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
};

export const HeaderCell = memo(HeaderCellComponent);
