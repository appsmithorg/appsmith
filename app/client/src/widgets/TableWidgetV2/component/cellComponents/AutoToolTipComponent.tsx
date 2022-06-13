import React, { createRef, useEffect, useState } from "react";
import { Tooltip } from "@blueprintjs/core";
import { CellWrapper, TooltipContentWrapper } from "../TableStyledWrappers";
import { CellAlignment, VerticalAlignment } from "../Constants";
import { ReactComponent as OpenNewTabIcon } from "assets/icons/control/open-new-tab.svg";
import styled from "styled-components";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";

export const OpenNewTabIconWrapper = styled.div`
  left: 4px;
  top: -2px;
  position: relative;
`;

export const ColumnWrapper = styled.div<{
  textColor?: string;
}>`
  display: flex;
  align-items: center;
  height: 100%;
  color: ${(props) => props.textColor};
`;

export const Content = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface Props {
  isHidden?: boolean;
  isCellVisible?: boolean;
  children: React.ReactNode;
  title: string;
  tableWidth?: number;
  columnType?: string;
  className?: string;
  compactMode?: string;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  textColor?: string;
  fontStyle?: string;
  cellBackground?: string;
  textSize?: string;
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
      allowCellWrapping={props.allowCellWrapping}
      cellBackground={props.cellBackground}
      compactMode={props.compactMode}
      fontStyle={props.fontStyle}
      horizontalAlignment={props.horizontalAlignment}
      isCellVisible={props.isCellVisible}
      isHidden={props.isHidden}
      isHyperLink
      isTextType
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        window.open(props.title, "_blank");
      }}
      textColor={props.textColor}
      textSize={props.textSize}
      useLinkToolTip={useToolTip}
      verticalAlignment={props.verticalAlignment}
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
    <ColumnWrapper className={props.className} textColor={props.textColor}>
      <CellWrapper
        allowCellWrapping={props.allowCellWrapping}
        cellBackground={props.cellBackground}
        compactMode={props.compactMode}
        fontStyle={props.fontStyle}
        horizontalAlignment={props.horizontalAlignment}
        isCellVisible={props.isCellVisible}
        isHidden={props.isHidden}
        isTextType
        textColor={props.textColor}
        textSize={props.textSize}
        verticalAlignment={props.verticalAlignment}
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
            {<Content ref={ref}>{props.children}</Content>}
          </Tooltip>
        ) : (
          <Content ref={ref}>{props.children}</Content>
        )}
      </CellWrapper>
    </ColumnWrapper>
  );
}

export default AutoToolTipComponent;
