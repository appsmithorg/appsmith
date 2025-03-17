import React from "react";
import styled from "styled-components";
import { MULTISELECT_CHECKBOX_WIDTH } from "../Constants";
import TableColumnHeader from "../header/TableColumnHeader";
import { useAppsmithTable } from "../TableContext";

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
  const { getTableBodyProps, multiRowSelection, totalColumnsWidth } =
    useAppsmithTable();

  return (
    <>
      <TableColumnHeader />
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
