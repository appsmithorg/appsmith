import React, { createRef, useEffect, useState } from "react";
import { Tooltip } from "@blueprintjs/core";
import { CellWrapper } from "components/designSystems/appsmith/TableComponent/TableStyledWrappers";
import {
  CellLayoutProperties,
  ColumnTypes,
} from "components/designSystems/appsmith/TableComponent/Constants";
import styled from "styled-components";

const TooltipContentWrapper = styled.div<{ width: number }>`
  word-break: break-all;
  max-width: ${(props) => props.width}px;
`;

const AutoToolTipComponent = (props: {
  isHidden?: boolean;
  children: React.ReactNode;
  title: string;
  cellProperties?: CellLayoutProperties;
  tableWidth?: number;
  columnType?: string;
}) => {
  const ref = createRef<HTMLDivElement>();
  const [useToolTip, updateToolTip] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (element && element.offsetWidth < element.scrollWidth) {
      updateToolTip(true);
    } else {
      updateToolTip(false);
    }
  }, [ref]);
  const isLink = props.columnType === ColumnTypes.URL;
  return (
    <CellWrapper
      ref={ref}
      isHidden={props.isHidden}
      cellProperties={props.cellProperties}
      isHyperLink={isLink}
      onClick={() => {
        if (isLink) {
          window.open(props.title, "_blank");
        }
      }}
    >
      {useToolTip && props.children ? (
        <Tooltip
          autoFocus={false}
          hoverOpenDelay={1000}
          content={
            <TooltipContentWrapper width={(props.tableWidth || 300) - 32}>
              {props.title}
            </TooltipContentWrapper>
          }
          position="top"
        >
          {props.children}
        </Tooltip>
      ) : (
        props.children
      )}
    </CellWrapper>
  );
};

export default AutoToolTipComponent;
