import React, { createRef, useEffect, useState } from "react";
import { Tooltip } from "@blueprintjs/core";
import { CellWrapper } from "components/designSystems/appsmith/TableStyledWrappers";
import styled from "styled-components";

const TooltipContentWrapper = styled.div<{ width: number }>`
  word-break: break-all;
  max-width: ${(props) => props.width}px;
`;

const AutoToolTipComponent = (props: {
  isHidden?: boolean;
  children: React.ReactNode;
  title: string;
  tableWidth?: number;
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
  return (
    <CellWrapper ref={ref} isHidden={props.isHidden}>
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
