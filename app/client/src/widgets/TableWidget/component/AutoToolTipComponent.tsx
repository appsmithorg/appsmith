import React, { createRef, memo, useEffect, useState } from "react";
import { Tooltip } from "@blueprintjs/core";
import { CellWrapper, ColumnWrapper } from "./TableStyledWrappers";
import { CellLayoutProperties, ColumnTypes } from "./Constants";
import { ReactComponent as OpenNewTabIcon } from "assets/icons/control/open-new-tab.svg";
import styled from "styled-components";
import isEqual from "fast-deep-equal";

const TooltipContentWrapper = styled.div<{ width: number }>`
  word-break: break-all;
  max-width: ${(props) => props.width}px;
`;

export const OpenNewTabIconWrapper = styled.div`
  left: 4px;
  height: 28px;
  align-items: center;
  position: relative;
`;

export const Content = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 4px;
`;

interface Props {
  isHidden?: boolean;
  isCellVisible?: boolean;
  noPadding?: boolean;
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
  }, [props.children, ref.current]);
  return (
    <CellWrapper
      cellProperties={props.cellProperties}
      isCellVisible={props.isCellVisible}
      isHidden={props.isHidden}
      isHyperLink
      isPadding
      isTextType
      onClick={() => {
        window.open(props.title, "_blank");
      }}
      useLinkToolTip={useToolTip}
    >
      <div className="link-text">
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
            {<Content ref={ref}>{props.children}</Content>}
          </Tooltip>
        ) : (
          <Content ref={ref}>{props.children}</Content>
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
  }, [props.children, ref.current]);
  if (props.columnType === ColumnTypes.URL && props.title) {
    return <LinkWrapper {...props} />;
  }
  return (
    <ColumnWrapper>
      <CellWrapper
        cellProperties={props.cellProperties}
        isCellVisible={props.isCellVisible}
        isHidden={props.isHidden}
        isPadding={!props.noPadding}
        isTextType
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
            <Content ref={ref}>{props.children}</Content>
          </Tooltip>
        ) : (
          <Content ref={ref}>{props.children}</Content>
        )}
      </CellWrapper>
    </ColumnWrapper>
  );
}
export default memo(
  AutoToolTipComponent,
  (prev, next) =>
    isEqual(prev.cellProperties, next.cellProperties) &&
    prev.isHidden === next.isHidden &&
    prev.isCellVisible === next.isCellVisible &&
    prev.noPadding === next.noPadding &&
    prev.children === next.children &&
    prev.title === next.title &&
    prev.tableWidth === next.tableWidth &&
    prev.columnType === next.columnType,
);
