import React, { createRef, useEffect, useState } from "react";
import { Tooltip } from "@blueprintjs/core";
import { CellWrapper, TooltipContentWrapper } from "../TableStyledWrappers";
import type { CellAlignment, VerticalAlignment } from "../Constants";
import styled from "styled-components";
import { ColumnTypes } from "widgets/wds/WDSTableWidget/constants";
import { importSvg } from "@appsmith/ads-old";

const OpenNewTabIcon = importSvg(
  async () => import("assets/icons/control/open-new-tab.svg"),
);

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
const TOOLTIP_OPEN_DELAY = 500;

function useToolTip(
  children: React.ReactNode,
  tableWidth?: number,
  title?: string,
) {
  const ref = createRef<HTMLDivElement>();
  const [requiresTooltip, setRequiresTooltip] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const mouseEnterHandler = () => {
      const element = ref.current?.querySelector("div") as HTMLDivElement;

      /*
       * Using setTimeout to simulate hoverOpenDelay of the tooltip
       * during initial render
       */
      timeout = setTimeout(() => {
        if (element && element.offsetWidth < element.scrollWidth) {
          setRequiresTooltip(true);
        } else {
          setRequiresTooltip(false);
        }

        ref.current?.removeEventListener("mouseenter", mouseEnterHandler);
        ref.current?.removeEventListener("mouseleave", mouseLeaveHandler);
      }, TOOLTIP_OPEN_DELAY);
    };

    const mouseLeaveHandler = () => {
      clearTimeout(timeout);
    };

    ref.current?.addEventListener("mouseenter", mouseEnterHandler);
    ref.current?.addEventListener("mouseleave", mouseLeaveHandler);

    return () => {
      ref.current?.removeEventListener("mouseenter", mouseEnterHandler);
      ref.current?.removeEventListener("mouseleave", mouseLeaveHandler);
      clearTimeout(timeout);
    };
  }, [children]);

  return requiresTooltip && children ? (
    <Tooltip
      autoFocus={false}
      content={
        <TooltipContentWrapper width={(tableWidth || MAX_WIDTH) - WIDTH_OFFSET}>
          {title}
        </TooltipContentWrapper>
      }
      defaultIsOpen
      hoverOpenDelay={TOOLTIP_OPEN_DELAY}
      position="top"
    >
      {
        <Content className="t--table-cell-tooltip-target" ref={ref}>
          {children}
        </Content>
      }
    </Tooltip>
  ) : (
    <Content className="t--table-cell-tooltip-target" ref={ref}>
      {children}
    </Content>
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
  disablePadding?: boolean;
  url?: string;
  isCellDisabled?: boolean;
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
      isCellDisabled={props.isCellDisabled}
      isCellVisible={props.isCellVisible}
      isHidden={props.isHidden}
      isHyperLink
      isTextType
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        window.open(props.url, "_blank");
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
        disablePadding={props.disablePadding}
        fontStyle={props.fontStyle}
        horizontalAlignment={props.horizontalAlignment}
        isCellDisabled={props.isCellDisabled}
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
