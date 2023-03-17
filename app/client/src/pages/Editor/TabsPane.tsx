import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import useHorizontalResize from "utils/hooks/useHorizontalResize";
import { tailwindLayers } from "constants/Layers";
import classNames from "classnames";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import EditorsRouter from "pages/Editor/routes";
import * as Sentry from "@sentry/react";
import { Route } from "react-router";
import { TABS_PANE_MIN_WIDTH } from "reducers/uiReducers/multiPaneReducer";
import useWindowDimensions from "utils/hooks/useWindowDimensions";
import { SIDE_NAV_WIDTH } from "pages/common/SideNav";

const TabsContainer = styled.div`
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => props.theme.bottomBarHeight}
  );
`;

const SentryRoute = Sentry.withSentryRouting(Route);

type Props = {
  width: number;
  onWidthChange: (width: number) => void;
};

const TabsPane = (props: Props) => {
  const { onWidthChange, width } = props;
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isPreviewMode = useSelector(previewModeSelector);
  const [windowWidth] = useWindowDimensions();

  const resizer = useHorizontalResize(sidebarRef, onWidthChange);

  useEffect(() => {
    // Tabs width should be 1/3 of the screen but not less than minimum
    const initialWidth = Math.max(
      (windowWidth - SIDE_NAV_WIDTH) / 3,
      TABS_PANE_MIN_WIDTH,
    );
    onWidthChange(initialWidth);
  }, []);

  return (
    <TabsContainer
      className={classNames({
        "transition-all transform duration-400 border-r border-gray-200": true,
        "translate-x-0 opacity-0": isPreviewMode,
        "opacity-100": !isPreviewMode,
        [`w-[${width}px] min-w-[${TABS_PANE_MIN_WIDTH}px] translate-x-${width}`]:
          !isPreviewMode,
      })}
      ref={sidebarRef}
    >
      <div
        className="overflow-x-hidden overflow-y-auto"
        style={{ width: width }}
      >
        <SentryRoute component={EditorsRouter} />
      </div>
      {/* RESIZER */}
      <div
        className={`absolute w-2 h-full -mr-1 ${tailwindLayers.resizer} group cursor-ew-resize`}
        onMouseDown={resizer.onMouseDown}
        onTouchEnd={resizer.onMouseUp}
        onTouchStart={resizer.onTouchStart}
        style={{
          left: width,
          display: isPreviewMode ? "none" : "initial",
        }}
      >
        <div
          className={classNames({
            "w-2 h-full bg-transparent group-hover:bg-gray-300 transform transition flex items-center":
              true,
            "bg-blue-500": resizer.resizing,
          })}
        />
      </div>
    </TabsContainer>
  );
};

export default TabsPane;
