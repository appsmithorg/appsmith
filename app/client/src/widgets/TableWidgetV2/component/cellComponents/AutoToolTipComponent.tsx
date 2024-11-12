import { Tooltip } from "@blueprintjs/core";
import { importSvg } from "@appsmith/ads-old";
import React, { createRef, useEffect, useState } from "react";
import styled from "styled-components";
import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import type { CellAlignment, VerticalAlignment } from "../Constants";
import { CellWrapper, TooltipContentWrapper } from "../TableStyledWrappers";

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
const MAX_WIDTH = 500;
const TOOLTIP_OPEN_DELAY = 500;
const MAX_CHARS_ALLOWED_IN_TOOLTIP = 200;

export function isButtonTextTruncated(element: HTMLElement): boolean {
  const spanElement = element.querySelector("span");

  if (!spanElement) {
    return false;
  }

  const offsetWidth = spanElement.offsetWidth;
  const scrollWidth = spanElement.scrollWidth;

  return scrollWidth > offsetWidth;
}

function useToolTip(
  children: React.ReactNode,
  title?: string,
  isButton?: boolean,
) {
  const ref = createRef<HTMLDivElement>();
  const [requiresTooltip, setRequiresTooltip] = useState(false);

  useEffect(
    function setupMouseHandlers() {
      let timeout: ReturnType<typeof setTimeout>;
      const currentRef = ref.current;

      if (!currentRef) return;

      const mouseEnterHandler = () => {
        timeout = setTimeout(() => {
          const element = currentRef?.querySelector("div") as HTMLDivElement;

          /*
           * Using setTimeout to simulate hoverOpenDelay of the tooltip
           * during initial render
           */
          if (element && element.offsetWidth < element.scrollWidth) {
            setRequiresTooltip(true);
          } else if (isButton && element && isButtonTextTruncated(element)) {
            setRequiresTooltip(true);
          } else {
            setRequiresTooltip(false);
          }

          currentRef?.removeEventListener("mouseenter", mouseEnterHandler);
          currentRef?.removeEventListener("mouseleave", mouseLeaveHandler);
        }, TOOLTIP_OPEN_DELAY);
      };

      const mouseLeaveHandler = () => {
        setRequiresTooltip(false);
        clearTimeout(timeout);
      };

      currentRef?.addEventListener("mouseenter", mouseEnterHandler);
      currentRef?.addEventListener("mouseleave", mouseLeaveHandler);

      return () => {
        currentRef?.removeEventListener("mouseenter", mouseEnterHandler);
        currentRef?.removeEventListener("mouseleave", mouseLeaveHandler);
        clearTimeout(timeout);
      };
    },
    [children, isButton, ref],
  );

  return requiresTooltip && children ? (
    <Tooltip
      autoFocus={false}
      boundary="viewport"
      content={
        <TooltipContentWrapper width={MAX_WIDTH - WIDTH_OFFSET}>
          {title && title.length > MAX_CHARS_ALLOWED_IN_TOOLTIP
            ? `${title.substring(0, MAX_CHARS_ALLOWED_IN_TOOLTIP)} (...)`
            : title}
        </TooltipContentWrapper>
      }
      defaultIsOpen
      hoverOpenDelay={TOOLTIP_OPEN_DELAY}
      position="bottom"
      usePortal
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
  columnType?: ColumnTypes;
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

export function AutoToolTipComponent(props: Props) {
  const content = useToolTip(
    props.children,
    props.title,
    props.columnType === ColumnTypes.BUTTON,
  );

  let contentToRender;

  switch (props.columnType) {
    case ColumnTypes.BUTTON:
      if (props.title) {
        return content;
      }

      break;
    case ColumnTypes.URL:
      contentToRender = (
        <>
          <div className="link-text">{content}</div>
          <OpenNewTabIconWrapper className="hidden-icon">
            <OpenNewTabIcon />
          </OpenNewTabIconWrapper>
        </>
      );
      break;
    default:
      contentToRender = content;
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
        isHyperLink={props.columnType === ColumnTypes.URL}
        isTextType
        textColor={props.textColor}
        textSize={props.textSize}
        verticalAlignment={props.verticalAlignment}
      >
        {contentToRender}
      </CellWrapper>
    </ColumnWrapper>
  );
}

export default AutoToolTipComponent;
