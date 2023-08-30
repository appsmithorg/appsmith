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
import { tailwindLayers } from "../../constants/Layers";
import classNames from "classnames";
import { Tooltip } from "design-system";
import useHorizontalResize from "../../utils/hooks/useHorizontalResize";
import { useDispatch, useSelector } from "react-redux";
import { getIdeSidebarWidth } from "./ideSelector";
import { setIdeSidebarWidth } from "./ideActions";

const Container = styled.div`
  background-color: white;
  margin-top: 4px;
  border-radius: 4px;
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

  /**
   * on hover end of resizer, hide tooltip
   */
  const onHoverEndResizer = useCallback(() => {
    clearTimeout(tooltipTimeout);
    setTooltipIsOpen(false);
  }, [setTooltipIsOpen]);
  return (
    <Container ref={sidebarRef} style={{ width: leftPaneWidth }}>
      <StyledResizer
        className={`absolute w-2 h-full -mr-1 ${tailwindLayers.resizer} group cursor-ew-resize`}
        onMouseDown={resizer.onMouseDown}
        onMouseEnter={onHoverResizer}
        onMouseLeave={onHoverEndResizer}
        onTouchEnd={resizer.onMouseUp}
        onTouchStart={resizer.onTouchStart}
        resizing={resizer.resizing}
        style={{
          left: leftPaneWidth + 50,
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
      <div>
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
