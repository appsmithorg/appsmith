import classNames from "classnames";
import history from "utils/history";
import * as Sentry from "@sentry/react";
import { useDispatch, useSelector } from "react-redux";
import { PanelStack } from "@blueprintjs/core";
import React, { memo, useEffect, useRef, useCallback, useState } from "react";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { AppState } from "reducers";
import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import Explorer from "pages/Editor/Explorer";
import Switcher from "components/ads/Switcher";
import { BUILDER_PAGE_URL } from "constants/routes";
import AppComments from "comments/AppComments/AppComments";
import { getExplorerPinned } from "selectors/explorerSelector";
import { previewModeSelector } from "selectors/editorSelectors";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import OnboardingStatusbar from "pages/Editor/FirstTimeUserOnboarding/Statusbar";

type Props = {
  width: number;
  onWidthChange?: (width: number) => void;
  onDragEnd?: () => void;
};

export const EntityExplorerSidebar = memo((props: Props) => {
  const dispatch = useDispatch();
  const [active, setActive] = useState(true);
  const pageId = useSelector(getCurrentPageId);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pinned = useSelector(getExplorerPinned);
  const isPreviewMode = useSelector(previewModeSelector);
  const applicationId = useSelector(getCurrentApplicationId);
  const enableFirstTimeUserOnboarding = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const resizer = useHorizontalResize(
    sidebarRef,
    props.onWidthChange,
    props.onDragEnd,
  );
  const switches = [
    {
      id: "explorer",
      text: "Explorer",
      action: () => dispatch(forceOpenWidgetPanel(false)),
    },
    {
      id: "widgets",
      text: "Widgets",
      action: () => {
        !(
          BUILDER_PAGE_URL(applicationId, pageId) === window.location.pathname
        ) && history.push(BUILDER_PAGE_URL(applicationId, pageId));
        setTimeout(() => dispatch(forceOpenWidgetPanel(true)), 0);
      },
    },
  ];
  const [activeSwitch, setActiveSwitch] = useState(switches[0]);
  const isForceOpenWidgetPanel = useSelector(
    (state: AppState) => state.ui.onBoarding.forceOpenWidgetPanel,
  );
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );
  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  useEffect(() => {
    if (isForceOpenWidgetPanel) {
      setActiveSwitch(switches[1]);
    } else {
      setActiveSwitch(switches[0]);
    }
  }, [isForceOpenWidgetPanel]);

  // registering event listeners
  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [active, pinned]);

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
    if (!pinned && !active) {
      const current = event.touches[0].clientX;

      if (current <= 10) {
        setActive(true);
      }
    }
  };

  /**
   * if the sidebar is not pinned and we are not resizing,
   * sets the active
   */
  const onMouseLeave = useCallback(() => {
    if (!pinned && !resizer.resizing) {
      setActive(false);
    }
  }, [active, setActive, pinned, resizer.resizing]);

  return (
    <div
      className={classNames({
        "js-entity-explorer transform transition flex h-full z-3 duration-300 border-r border-gray-200": true,
        "relative ": pinned && !isPreviewMode,
        "-translate-x-full": (!pinned && !active) || isPreviewMode,
        fixed: !pinned || isPreviewMode,
      })}
      onMouseLeave={onMouseLeave}
    >
      {/* SIDEBAR */}
      <div
        className="flex flex-col p-0 overflow-y-auto text-white bg-white t--sidebar min-w-48 max-w-96"
        ref={sidebarRef}
        style={{ width: props.width }}
      >
        {(enableFirstTimeUserOnboarding ||
          isFirstTimeUserOnboardingComplete) && <OnboardingStatusbar />}
        <div className="p-2">
          <Switcher activeObj={activeSwitch} switches={switches} />
        </div>
        <PanelStack
          className="flex-grow"
          initialPanel={{
            component: Explorer,
          }}
          showPanelHeader={false}
        />
        <AppComments />
      </div>
      {/* RESIZER */}
      <div
        className="absolute z-10 w-2 h-full -mr-1 group cursor-ew-resize"
        onMouseDown={resizer.onMouseDown}
        onTouchEnd={resizer.onMouseUp}
        onTouchStart={resizer.onTouchStart}
        style={{ left: !pinned && !active ? 0 : props.width }}
      >
        <div
          className={classNames({
            "w-1 h-full bg-transparent group-hover:bg-blue-500 transform transition": true,
            "bg-blue-500": resizer.resizing,
          })}
        />
      </div>
    </div>
  );
});

EntityExplorerSidebar.displayName = "EntityExplorerSidebar";

export default Sentry.withProfiler(EntityExplorerSidebar);
