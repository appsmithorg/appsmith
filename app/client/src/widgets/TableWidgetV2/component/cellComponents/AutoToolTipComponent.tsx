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
  width: 100%;
`;

const WIDTH_OFFSET = 32;
const MAX_WIDTH = 300;

function useToolTip(
  children: React.ReactNode,
  tableWidth?: number,
  title?: string,
) {
  const ref = createRef<HTMLDivElement>();
  const [showTooltip, updateToolTip] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      const element = ref.current?.querySelector("div") as HTMLDivElement;
      if (element && element.offsetWidth < element.scrollWidth) {
        updateToolTip(true);
      } else {
        updateToolTip(false);
      }
    });
  }, [children, ref.current]);

  return showTooltip && children ? (
    <Tooltip
      autoFocus={false}
      content={
        <TooltipContentWrapper width={(tableWidth || MAX_WIDTH) - WIDTH_OFFSET}>
          {title}
        </TooltipContentWrapper>
      }
      hoverOpenDelay={1000}
      position="top"
    >
      {<Content ref={ref}>{children}</Content>}
    </Tooltip>
  ) : (
    <Content ref={ref}>{children}</Content>
  );
}

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
  const content = useToolTip(props.children, props.tableWidth, props.title);

  return (
    <CellWrapper
      allowCellWrapping={props.allowCellWrapping}
      cellBackground={props.cellBackground}
      className="cell-wrapper"
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
      verticalAlignment={props.verticalAlignment}
    >
      <div className="link-text">{content}</div>
      <OpenNewTabIconWrapper className="hidden-icon">
        <OpenNewTabIcon />
      </OpenNewTabIconWrapper>
    </CellWrapper>
  );
}

function AutoToolTipComponent(props: Props) {
  const content = useToolTip(props.children, props.tableWidth, props.title);

  if (props.columnType === ColumnTypes.URL && props.title) {
    return <LinkWrapper {...props} />;
  }

  return (
    <ColumnWrapper className={props.className} textColor={props.textColor}>
      <CellWrapper
        allowCellWrapping={props.allowCellWrapping}
        cellBackground={props.cellBackground}
        className="cell-wrapper"
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
        {content}
      </CellWrapper>
    </ColumnWrapper>
  );
}

export default AutoToolTipComponent;
