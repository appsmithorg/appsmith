import * as Sentry from "@sentry/react";
import classNames from "classnames";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";

import { updateExplorerWidthAction } from "actions/explorerActions";
import {
  getExplorerActive,
  getExplorerWidth,
} from "selectors/explorerSelector";
import { tailwindLayers } from "constants/Layers";
import { Tooltip } from "@appsmith/ads";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { SIDEBAR_ID } from "constants/Explorer";
import styled from "styled-components";
import { formatDistanceToNow, parseISO } from "date-fns";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const StyledResizer = styled.div<{ resizing: boolean }>`
  ${(props) =>
    props.resizing &&
    `
  & > div {
    background-color: var(--ads-v2-color-outline);
  }
  `}
  :hover {
    & > div {
      background-color: var(--ads-v2-color-bg-emphasis);
    }
  }
`;

interface Props {
  children: React.ReactNode;
}

export const EntityExplorerSidebar = memo(({ children }: Props) => {
  let tooltipTimeout: ReturnType<typeof setTimeout>;
  const dispatch = useDispatch();
  const width = useSelector(getExplorerWidth);
  const active = useSelector(getExplorerActive);
  const sidebarRef = useRef<HTMLDivElement>(null);

  /**
   * on entity explorer sidebar width change
   *
   * @return void
   */
  const onWidthChange = useCallback((newWidth) => {
    dispatch(updateExplorerWidthAction(newWidth));
  }, []);

  /**
   * on entity explorer sidebar drag end
   *
   * @return void
   */
  const onDragEnd = useCallback(() => {
    dispatch(updateExplorerWidthAction(width));
  }, [width]);

  const resizer = useHorizontalResize(sidebarRef, onWidthChange, onDragEnd);
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);

  /**
   * on hover of resizer, show tooltip
   */
  const onHoverResizer = useCallback(() => {
    tooltipTimeout = setTimeout(() => {
      setTooltipIsOpen(true);
    }, 250);
  }, [setTooltipIsOpen]);

  /**
   * on hover end of resizer, hide tooltip
   */
  const onHoverEndResizer = useCallback(() => {
    clearTimeout(tooltipTimeout);
    setTooltipIsOpen(false);
  }, [setTooltipIsOpen]);

  /**
   * resizer left position
   */
  const resizerLeft = useMemo(() => {
    return !active ? 0 : width;
  }, [active, width]);

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.SET_ENTITY_INFO,
      payload: { show: false },
    });
  }, [resizerLeft]);

  const [hoverStartTime, setHoverStartTime] = useState(0);

  const handleMouseEnter = useCallback(() => {
    setHoverStartTime(Date.now());
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverStartTime !== 0) {
      const timeTaken = Math.floor((Date.now() - hoverStartTime) / 1000);

      AnalyticsUtil.logEvent("TIME_TO_NAVIGATE_ENTITY_EXPLORER", { timeTaken });
      setHoverStartTime(0);
    }
  }, [hoverStartTime]);

  return (
    <div
      className={classNames({
        "js-entity-explorer t--entity-explorer transition-transform transform  flex h-full duration-400 relative":
          true,
        "-translate-x-80": !active,
      })}
      data-testid={active ? "sidebar-active" : "sidebar"}
      id={SIDEBAR_ID}
    >
      {/* SIDEBAR */}
      <div
        className="flex flex-col p-0 bg-white min-w-52 max-w-96 group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={sidebarRef}
        style={{ width: width }}
      >
        {children}
      </div>
      {/* RESIZER */}
      <StyledResizer
        className={`absolute w-2 h-full -mr-1 ${tailwindLayers.resizer} group cursor-ew-resize`}
        onMouseDown={resizer.onMouseDown}
        onMouseEnter={onHoverResizer}
        onMouseLeave={onHoverEndResizer}
        onTouchEnd={resizer.onMouseUp}
        onTouchStart={resizer.onTouchStart}
        resizing={resizer.resizing}
        style={{
          left: resizerLeft,
          display: "initial",
        }}
      >
        <div
          className={classNames({
            "w-1 h-full bg-transparent transform transition flex items-center":
              true,
          })}
        >
          <Tooltip
            content="Drag to resize"
            mouseEnterDelay={0.2}
            placement="right"
            visible={tooltipIsOpen && !resizer.resizing}
          >
            <div />
          </Tooltip>
        </div>
      </StyledResizer>
    </div>
  );
});

EntityExplorerSidebar.displayName = "EntityExplorerSidebar";

export default Sentry.withProfiler(EntityExplorerSidebar);
