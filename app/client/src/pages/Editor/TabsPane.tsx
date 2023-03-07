import React, { useRef } from "react";
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
import { getExplorerActive } from "../../selectors/explorerSelector";
import { getPropertyPaneWidth } from "../../selectors/propertyPaneSelectors";

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
  const isExplorerActive = useSelector(getExplorerActive);
  const propertyPaneWidth = useSelector(getPropertyPaneWidth);

  const resizer = useHorizontalResize(sidebarRef, onWidthChange);

  return (
    <TabsContainer
      className={classNames({
        "transition-all transform duration-200 border-r border-gray-200 z-[3] bg-white": true,
        "translate-x-0 opacity-0": isPreviewMode,
        "opacity-100": !isPreviewMode,
        [`w-[${width}px] min-w-[${TABS_PANE_MIN_WIDTH}px] translate-x-${width}`]: !isPreviewMode,
      })}
      ref={sidebarRef}
      style={{ marginLeft: isExplorerActive ? `${propertyPaneWidth}px` : 0 }}
    >
      <div style={{ width: width }}>
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
            "w-2 h-full bg-transparent group-hover:bg-gray-300 transform transition flex items-center": true,
            "bg-blue-500": resizer.resizing,
          })}
        />
      </div>
    </TabsContainer>
  );
};

export default TabsPane;
