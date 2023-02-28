import React from "react";
import { useContext } from "react";
import styled from "styled-components";
import { MULTISELECT_CHECKBOX_WIDTH } from "../Constants";
import { BodyContext } from "../TableBody";
import { HeaderComponent } from "./TableHeaderComponent";

const StyledTableBodyWrapper = styled.div<{
  multiRowSelection?: boolean;
  totalColumnsWidth: number;
}>`
  width: ${(props) =>
    props.multiRowSelection
      ? MULTISELECT_CHECKBOX_WIDTH + props.totalColumnsWidth
      : props.totalColumnsWidth}px !important;
`;

export const VirtualTableInnerElement = ({
  children,
  outerRef,
  style,
  ...rest
}: any) => {
  const {
    getTableBodyProps,
    headerProps,
    multiRowSelection,
    totalColumnsWidth,
  } = useContext(BodyContext) as any;

  return (
    <>
      <HeaderComponent {...headerProps} />
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
