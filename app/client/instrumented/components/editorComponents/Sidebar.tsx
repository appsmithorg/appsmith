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
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import Explorer from "pages/Editor/Explorer";
import { setExplorerActiveAction } from "actions/explorerActions";
import {
  getExplorerActive,
  getExplorerPinned,
} from "selectors/explorerSelector";
import { tailwindLayers } from "constants/Layers";
import { Tooltip } from "design-system";
import { previewModeSelector } from "selectors/editorSelectors";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import OnboardingStatusbar from "pages/Editor/FirstTimeUserOnboarding/Statusbar";
import Pages from "pages/Editor/Explorer/Pages";
import { EntityProperties } from "pages/Editor/Explorer/Entity/EntityProperties";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { SIDEBAR_ID } from "constants/Explorer";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import { getEditingEntityName } from "selectors/entitiesSelector";
import styled from "styled-components";

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

type Props = {
  width: number;
  onWidthChange?: (width: number) => void;
  onDragEnd?: () => void;
};

export const EntityExplorerSidebar = memo((props: Props) => {
  let tooltipTimeout: ReturnType<typeof setTimeout>;
  const dispatch = useDispatch();
  const active = useSelector(getExplorerActive);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pinned = useSelector(getExplorerPinned);
  const isPreviewMode = useSelector(previewModeSelector);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const isPreviewingApp =
    isPreviewMode || isAppSettingsPaneWithNavigationTabOpen;
  const enableFirstTimeUserOnboarding = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const resizer = useHorizontalResize(
    sidebarRef,
    props.onWidthChange,
    props.onDragEnd,
  );
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
          currentX >= props.width + 20 &&
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
    return !pinned && !active ? 0 : props.width;
  }, [pinned, active, props.width]);

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.SET_ENTITY_INFO,
      payload: { show: false },
    });
  }, [
    resizerLeft,
    pinned,
    isPreviewMode,
    isAppSettingsPaneWithNavigationTabOpen,
  ]);

  return (
    <div
      className={classNames({
        [`js-entity-explorer t--entity-explorer transform transition-all flex h-[inherit] duration-400 border-r ${tailwindLayers.entityExplorer}`]:
          true,
        relative: pinned && !isPreviewingApp,
        "-translate-x-full": (!pinned && !active) || isPreviewingApp,
        "shadow-xl": !pinned,
        fixed: !pinned || isPreviewingApp,
      })}
      data-testid={active ? "sidebar-active" : "sidebar"}
      id={SIDEBAR_ID}
    >
      {/* SIDEBAR */}
      <div
        className="flex flex-col p-0 bg-white t--sidebar min-w-52 max-w-96 group"
        ref={sidebarRef}
        style={{ width: props.width }}
      >
        {enableFirstTimeUserOnboarding && <OnboardingStatusbar />}
        {/* PagesContainer */}
        <Pages />
        {/* Popover that contains the bindings info */}
        <EntityProperties />
        {/* Contains entity explorer & widgets library along with a switcher*/}
        <Explorer />
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
          display: isPreviewingApp ? "none" : "initial",
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
