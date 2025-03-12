import React from "react";
import { useContext } from "react";
import styled from "styled-components";
import { MULTISELECT_CHECKBOX_WIDTH } from "../Constants";
import { BodyContext } from "../TableBody/BodyContext";
import TableColumnHeader from "./TableColumnHeader";

const StyledTableBodyWrapper = styled.div<{
  multiRowSelection?: boolean;
  totalColumnsWidth: number;
}>`
  width: ${(props) =>
    props.multiRowSelection
      ? MULTISELECT_CHECKBOX_WIDTH + props.totalColumnsWidth
      : props.totalColumnsWidth}px !important;
`;

const VirtualTableInnerElement = ({
  children,
  outerRef,
  style,
  ...rest // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) => {
  const {
    accentColor,
    borderRadius,
    canFreezeColumn,
    columns,
    disableDrag,
    editMode,
    enableDrag,
    getTableBodyProps,
    handleAllRowSelectClick,
    handleColumnFreeze,
    handleReorderColumn,
    headerGroups,
    isResizingColumn,
    isSortable,
    multiRowSelection,
    prepareRow,
    rows,
    rowSelectionState,
    sortTableColumn,
    totalColumnsWidth,
    widgetId,
    width,
  } = // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useContext(BodyContext) as any;

  return (
    <>
      <TableColumnHeader
        accentColor={accentColor}
        borderRadius={borderRadius}
        canFreezeColumn={canFreezeColumn}
        columns={columns}
        disableDrag={disableDrag}
        editMode={editMode}
        enableDrag={enableDrag}
        handleAllRowSelectClick={handleAllRowSelectClick}
        handleColumnFreeze={handleColumnFreeze}
        handleReorderColumn={handleReorderColumn}
        headerGroups={headerGroups}
        headerWidth={
          multiRowSelection && totalColumnsWidth
            ? MULTISELECT_CHECKBOX_WIDTH + totalColumnsWidth
            : totalColumnsWidth
        }
        isResizingColumn={isResizingColumn}
        isSortable={isSortable}
        multiRowSelection={multiRowSelection}
        prepareRow={prepareRow}
        rowSelectionState={rowSelectionState}
        sortTableColumn={sortTableColumn}
        subPage={rows}
        widgetId={widgetId}
        width={width}
      />
      <StyledTableBodyWrapper
        className="tbody body"
        multiRowSelection={multiRowSelection}
        ref={outerRef}
        totalColumnsWidth={totalColumnsWidth}
      >
        <div {...getTableBodyProps()} {...rest} style={style}>
          {children}
        </div>
      </StyledTableBodyWrapper>
    </>
  );
};

export default VirtualTableInnerElement;
