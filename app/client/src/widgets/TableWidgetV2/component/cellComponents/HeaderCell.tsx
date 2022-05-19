import React, { createRef, useEffect, useState } from "react";
import { AnyStyledComponent } from "styled-components";
import { Tooltip } from "@blueprintjs/core";

import { Colors } from "constants/Colors";
import styled from "constants/DefaultTheme";
import { ControlIcons } from "icons/ControlIcons";
import { CellAlignment, JUSTIFY_CONTENT } from "../Constants";
import { ReactComponent as EditIcon } from "assets/icons/control/edit-variant1.svg";
import { TooltipContentWrapper } from "../TableStyledWrappers";

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
  }, [ref.current, ref.current?.scrollWidth]);

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

export function HeaderCell(props: {
  columnName: string;
  columnIndex: number;
  isHidden: boolean;
  isAscOrder?: boolean;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  isResizingColumn: boolean;
  column: any;
  editMode?: boolean;
  isSortable?: boolean;
}) {
  const { column, editMode, isSortable } = props;
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
    column.columnProperties.isEditable;

  return (
    <div
      {...column.getHeaderProps()}
      className="th header-reorder"
      onClick={!disableSort && props ? handleSortColumn : undefined}
    >
      <div className={!props.isHidden ? `draggable-header` : "hidden-header"}>
        <ColumnNameContainer
          horizontalAlignment={column.columnProperties.horizontalAlignment}
        >
          {isColumnEditable && <StyledEditIcon />}
          <Title>{props.columnName}</Title>
        </ColumnNameContainer>
      </div>
      {props.isAscOrder !== undefined ? (
        <div>
          {props.isAscOrder ? (
            <AscendingIcon height={16} width={16} />
          ) : (
            <DescendingIcon height={16} width={16} />
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
