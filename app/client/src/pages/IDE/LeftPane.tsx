import React, { useCallback, useRef, useState } from "react";
import styled from "styled-components";
import { Switch } from "react-router";
import {
  IDE_ADD_PATH,
  IDE_DATA_DETAIL_PATH,
  IDE_DATA_PATH,
  IDE_LIB_PATH,
  IDE_PAGE_PATH,
  IDE_SETTINGS_PATH,
} from "constants/routes";
import { SentryRoute } from "@appsmith/AppRouter";
import DataLeftPane from "./DataState/LeftPane";
import PageLeftPane from "./PageState/LeftPane";
import AddLeftPane from "./AddState/LeftPane";
import SettingsLeftPane from "./SettingsState/LeftPane";
import LibLeftPane from "./LibraryState/LeftPane";
import { Layers, tailwindLayers } from "../../constants/Layers";
import classNames from "classnames";
import { Tooltip } from "design-system";
import useHorizontalResize from "../../utils/hooks/useHorizontalResize";
import { useDispatch, useSelector } from "react-redux";
import { getIdeSidebarWidth } from "./ideSelector";
import { setIdeSidebarWidth } from "./ideActions";
import { getIsAppSettingsPaneOpen } from "selectors/appSettingsPaneSelectors";
import { useIDENavState } from "./hooks";

const Container = styled.div`
  background-color: white;
  border-radius: 4px;
  // TODO: auto size based on available space
  height: calc(100vh - 40px - 37px - 8px);
  position: relative;
  z-index: ${Layers.sideBar};
`;

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

const LeftPane = () => {
  const dispatch = useDispatch();
  const sidebarRef = useRef<HTMLDivElement>(null);
  let tooltipTimeout: ReturnType<typeof setTimeout>;
  const leftPaneWidth = useSelector(getIdeSidebarWidth);
  const setPaneWidth = useCallback((width: number) => {
    dispatch(setIdeSidebarWidth(width));
  }, []);
  const resizer = useHorizontalResize(sidebarRef, setPaneWidth, () =>
    setPaneWidth(leftPaneWidth),
  );
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
  const onHoverResizer = useCallback(() => {
    tooltipTimeout = setTimeout(() => {
      setTooltipIsOpen(true);
    }, 250);
  }, [setTooltipIsOpen]);
  const isSettingsPane = useSelector(getIsAppSettingsPaneOpen);
  const [navState] = useIDENavState();
  const isWidgetPageNav = navState.pageNav && navState.pageNav === "ui";
  const disableResize = isSettingsPane || isWidgetPageNav;

  /**
   * on hover end of resizer, hide tooltip
   */
  const onHoverEndResizer = useCallback(() => {
    clearTimeout(tooltipTimeout);
    setTooltipIsOpen(false);
  }, [setTooltipIsOpen]);
  return (
    <Container ref={sidebarRef} style={{ width: leftPaneWidth }}>
      {!disableResize && (
        <StyledResizer
          className={`absolute w-2 -mr-1 h-full ${tailwindLayers.resizer} group cursor-ew-resize`}
          onMouseDown={resizer.onMouseDown}
          onMouseEnter={onHoverResizer}
          onMouseLeave={onHoverEndResizer}
          onTouchEnd={resizer.onMouseUp}
          onTouchStart={resizer.onTouchStart}
          resizing={resizer.resizing}
          style={{
            left: leftPaneWidth,
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
      )}
      <div className="h-full w-full">
        <Switch>
          <SentryRoute component={DataLeftPane} exact path={IDE_DATA_PATH} />
          <SentryRoute
            component={DataLeftPane}
            exact
            path={IDE_DATA_DETAIL_PATH}
          />
          <SentryRoute component={PageLeftPane} path={IDE_PAGE_PATH} />
          <SentryRoute component={AddLeftPane} exact path={IDE_ADD_PATH} />
          <SentryRoute component={LibLeftPane} exact path={IDE_LIB_PATH} />
          <SentryRoute
            component={SettingsLeftPane}
            exact
            path={IDE_SETTINGS_PATH}
          />
        </Switch>
      </div>
    </Container>
  );
};

export default LeftPane;
