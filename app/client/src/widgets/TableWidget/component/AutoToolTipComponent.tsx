import React, { createRef, useEffect, useState } from "react";
import { Tooltip } from "@blueprintjs/core";
import { CellWrapper } from "./TableStyledWrappers";
import { CellLayoutProperties, ColumnTypes } from "./Constants";
import { ReactComponent as OpenNewTabIcon } from "assets/icons/control/open-new-tab.svg";
import styled from "styled-components";

const TooltipContentWrapper = styled.div<{ width: number }>`
  word-break: break-all;
  max-width: ${(props) => props.width}px;
`;

export const OpenNewTabIconWrapper = styled.div`
  left: 4px;
  top: 2px;
  position: relative;
`;

interface Props {
  isHidden?: boolean;
  isCellVisible?: boolean;
  children: React.ReactNode;
  title: string;
  cellProperties?: CellLayoutProperties;
  tableWidth?: number;
  columnType?: string;
}

function LinkWrapper(props: Props) {
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
    <CellWrapper
      cellProperties={props.cellProperties}
      isCellVisible={props.isCellVisible}
      isHidden={props.isHidden}
      isHyperLink
      isTextType
      onClick={() => {
        window.open(props.title, "_blank");
      }}
      useLinkToolTip={useToolTip}
    >
      <div className="link-text" ref={ref}>
        {useToolTip && props.children ? (
          <Tooltip
            autoFocus={false}
            content={
              <TooltipContentWrapper width={(props.tableWidth || 300) - 32}>
                {props.title}
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
      </div>
      <OpenNewTabIconWrapper className="hidden-icon">
        <OpenNewTabIcon />
      </OpenNewTabIconWrapper>
    </CellWrapper>
  );
}

function AutoToolTipComponent(props: Props) {
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
  if (props.columnType === ColumnTypes.URL && props.title) {
    return <LinkWrapper {...props} />;
  }
  return (
    <CellWrapper
      cellProperties={props.cellProperties}
      isCellVisible={props.isCellVisible}
      isHidden={props.isHidden}
      isTextType
      ref={ref}
    >
      {useToolTip && props.children ? (
        <Tooltip
          autoFocus={false}
          content={
            <TooltipContentWrapper width={(props.tableWidth || 300) - 32}>
              {props.title}
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
    </CellWrapper>
  );
}

export default AutoToolTipComponent;
