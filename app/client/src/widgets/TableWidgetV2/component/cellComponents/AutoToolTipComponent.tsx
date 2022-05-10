import React, { createRef, useEffect, useState } from "react";
import { Tooltip } from "@blueprintjs/core";
import { CellWrapper } from "../TableStyledWrappers";
import { CellAlignment, VerticalAlignment } from "../Constants";
import { ReactComponent as OpenNewTabIcon } from "assets/icons/control/open-new-tab.svg";
import styled from "styled-components";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { TextSize } from "constants/WidgetConstants";

const TooltipContentWrapper = styled.div<{ width: number }>`
  word-break: break-all;
  max-width: ${(props) => props.width}px;
`;

export const OpenNewTabIconWrapper = styled.div`
  left: 4px;
  top: 2px;
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
  }, [ref]);
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
  }, [ref.current]);
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
        ref={ref}
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
            {props.children}
          </Tooltip>
        ) : (
          props.children
        )}
      </CellWrapper>
    </ColumnWrapper>
  );
}

export default AutoToolTipComponent;
