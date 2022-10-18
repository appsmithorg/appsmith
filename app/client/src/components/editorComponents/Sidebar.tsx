import React, {
  memo,
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import classNames from "classnames";
import * as Sentry from "@sentry/react";
import { useDispatch, useSelector } from "react-redux";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import Explorer from "pages/Editor/Explorer";
import { setExplorerActiveAction } from "actions/explorerActions";
import {
  getExplorerActive,
  getExplorerPinned,
} from "selectors/explorerSelector";
import { tailwindLayers } from "constants/Layers";
import { TooltipComponent } from "design-system";
import { previewModeSelector } from "selectors/editorSelectors";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import OnboardingStatusbar from "pages/Editor/FirstTimeUserOnboarding/Statusbar";
import Pages from "pages/Editor/Explorer/Pages";
import { EntityProperties } from "pages/Editor/Explorer/Entity/EntityProperties";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { SIDEBAR_ID } from "constants/Explorer";

type Props = {
  width: number;
  onWidthChange?: (width: number) => void;
  onDragEnd?: () => void;
};

export const EntityExplorerSidebar = memo((props: Props) => {
  let tooltipTimeout: number;
  const dispatch = useDispatch();
  const active = useSelector(getExplorerActive);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pinned = useSelector(getExplorerPinned);
  const isPreviewMode = useSelector(previewModeSelector);
  const enableFirstTimeUserOnboarding = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const resizer = useHorizontalResize(
    sidebarRef,
    props.onWidthChange,
    props.onDragEnd,
  );
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );
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
  }, [active, pinned, resizer.resizing]);

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
        if (currentX >= props.width + 20 && !resizer.resizing) {
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
    return !pinned && !active ? 0 : props.width;
  }, [pinned, active, props.width]);

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.SET_ENTITY_INFO,
      payload: { show: false },
    });
  }, [resizerLeft, pinned, isPreviewMode]);

  return (
    <div
      className={classNames({
        [`js-entity-explorer t--entity-explorer transform transition-all flex h-full duration-400 border-r border-gray-200 ${tailwindLayers.entityExplorer}`]: true,
        relative: pinned && !isPreviewMode,
        "-translate-x-full": (!pinned && !active) || isPreviewMode,
        "shadow-xl": !pinned,
        fixed: !pinned || isPreviewMode,
      })}
      id={SIDEBAR_ID}
    >
      {/* SIDEBAR */}
      <div
        className="flex flex-col p-0 bg-white t--sidebar min-w-52 max-w-96 group"
        ref={sidebarRef}
        style={{ width: props.width }}
      >
        {(enableFirstTimeUserOnboarding ||
          isFirstTimeUserOnboardingComplete) && <OnboardingStatusbar />}
        {/* PagesContainer */}
        <Pages />
        {/* Popover that contains the bindings info */}
        <EntityProperties />
        {/* Contains entity explorer & widgets library along with a switcher*/}
        <Explorer />
      </div>
      {/* RESIZER */}
      <div
        className={`absolute w-2 h-full -mr-1 ${tailwindLayers.resizer} group cursor-ew-resize`}
        onMouseDown={resizer.onMouseDown}
        onMouseEnter={onHoverResizer}
        onMouseLeave={onHoverEndResizer}
        onTouchEnd={resizer.onMouseUp}
        onTouchStart={resizer.onTouchStart}
        style={{
          left: resizerLeft,
          display: isPreviewMode ? "none" : "initial",
        }}
      >
        <div
          className={classNames({
            "w-1 h-full bg-transparent group-hover:bg-gray-300 transform transition flex items-center": true,
            "bg-blue-500": resizer.resizing,
          })}
        >
          <TooltipComponent
            content={
              <div className="flex items-center justify-between">
                <span>Drag to resize</span>
              </div>
            }
            hoverOpenDelay={200}
            isOpen={tooltipIsOpen && !resizer.resizing}
            position="right"
          >
            <div />
          </TooltipComponent>
        </div>
      </div>
    </div>
  );
});

EntityExplorerSidebar.displayName = "EntityExplorerSidebar";

export default Sentry.withProfiler(EntityExplorerSidebar);
