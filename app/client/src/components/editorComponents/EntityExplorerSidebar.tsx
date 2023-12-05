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

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import {
  setExplorerActiveAction,
  updateExplorerWidthAction,
} from "actions/explorerActions";
import {
  getExplorerActive,
  getExplorerPinned,
  getExplorerWidth,
} from "selectors/explorerSelector";
import { tailwindLayers } from "constants/Layers";
import { Tooltip } from "design-system";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { SIDEBAR_ID } from "constants/Explorer";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import { getEditingEntityName } from "@appsmith/selectors/entitiesSelector";
import styled from "styled-components";
import moment from "moment";
import AnalyticsUtil from "../../utils/AnalyticsUtil";
import { useIsAppSidebarEnabled } from "../../navigation/featureFlagHooks";

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
  const pinned = useSelector(getExplorerPinned);
  const isAppSidebarEnabled = useIsAppSidebarEnabled();

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
  const isEditingEntityName = useSelector(getEditingEntityName);
  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  // registering event listeners
  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [active, pinned, resizer.resizing, isEditingEntityName]);

  /**
   * passing the event to touch move on mouse move
   *
   * @param event
   */
  const onMouseMove = (event: MouseEvent) => {
    const eventWithTouches = Object.assign({}, event, {
      touches: [{ clientX: event.clientX, clientY: event.clientY }],
    });
    onTouchMove(eventWithTouches);
  };

  /**
   * Is a context menu of any of the explorer entities open
   */
  const isContextMenuOpen = () => {
    const menus = document.getElementsByClassName(
      EntityClassNames.CONTEXT_MENU_CONTENT,
    );
    const node = menus[0];
    if (!document.body.contains(node)) {
      return false;
    }

    return true;
  };

  /**
   * calculate the new width based on the pixel moved
   *
   * @param event
   */
  const onTouchMove = (
    event:
      | TouchEvent
      | (MouseEvent & { touches: { clientX: number; clientY: number }[] }),
  ) => {
    const currentX = event.touches[0].clientX;

    // only calculate the following in unpin mode
    if (!pinned) {
      if (active) {
        // if user cursor is out of the entity explorer width ( with some extra window = 20px ), make the
        // entity explorer inactive. Also, 20px here is to increase the window in which a user can drag the resizer
        if (
          currentX >= width + 20 &&
          !resizer.resizing &&
          !isContextMenuOpen() &&
          !isEditingEntityName
        ) {
          dispatch(setExplorerActiveAction(false));
        }
      } else {
        // check if user cursor is at extreme left when the explorer is inactive, if yes, make the explorer active
        if (currentX <= 20) {
          dispatch(setExplorerActiveAction(true));
        }
      }
    }
  };

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
    return !pinned && !active ? 0 : width;
  }, [pinned, active, width]);

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.SET_ENTITY_INFO,
      payload: { show: false },
    });
  }, [resizerLeft, pinned]);

  const [hoverStartTime, setHoverStartTime] = useState(0);

  const handleMouseEnter = useCallback(() => {
    setHoverStartTime(Date.now());
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverStartTime !== 0) {
      const timeTaken = moment().diff(hoverStartTime, "seconds");
      AnalyticsUtil.logEvent("TIME_TO_NAVIGATE_ENTITY_EXPLORER", { timeTaken });
      setHoverStartTime(0);
    }
  }, [hoverStartTime]);

  return (
    <div
      className={classNames({
        "js-entity-explorer t--entity-explorer transition-transform transform  flex h-full duration-400":
          true,
        "border-r": !isAppSidebarEnabled,
        relative: pinned,
        "-translate-x-80": !pinned && !active,
        "shadow-xl": !pinned,
        fixed: !pinned,
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
