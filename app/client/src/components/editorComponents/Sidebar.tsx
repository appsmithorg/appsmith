import classNames from "classnames";
import * as Sentry from "@sentry/react";
import { useSelector } from "react-redux";
import { PanelStack } from "@blueprintjs/core";
import React, { memo, useEffect, useRef, useCallback, useState } from "react";

import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import Explorer from "pages/Editor/Explorer";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { getExplorerPinned } from "selectors/explorerSelector";
import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import OnboardingStatusbar from "pages/Editor/FirstTimeUserOnboarding/Statusbar";
import { previewModeSelector } from "selectors/editorSelectors";
import AppComments from "comments/AppComments/AppComments";

type Props = {
  width: number;
  onWidthChange: (width: number) => void;
};

export const EntityExplorerSidebar = memo((props: Props) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pinned = useSelector(getExplorerPinned);
  const [active, setActive] = useState(true);
  const isPreviewMode = useSelector(previewModeSelector);
  const resizer = useHorizontalResize(sidebarRef, props.onWidthChange);
  const enableFirstTimeUserOnboarding = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
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
        "transform transition flex h-full z-3 duration-300": true,
        "relative ": pinned && !isPreviewMode,
        "-translate-x-full": (!pinned && !active) || isPreviewMode,
        fixed: !pinned || isPreviewMode,
      })}
      onMouseLeave={onMouseLeave}
    >
      {/* SIDEBAR */}
      <div
        className="flex flex-col p-0 overflow-y-auto text-white t--sidebar bg-trueGray-800 min-w-48 max-w-96 scrollbar-thumb-red-300 hover:scrollbar-thumb-red-400"
        ref={sidebarRef}
        style={{ width: props.width }}
      >
        {(enableFirstTimeUserOnboarding ||
          isFirstTimeUserOnboardingComplete) && <OnboardingStatusbar />}
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
        className="z-10 w-2 h-full -mr-1 group cursor-ew-resize"
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
