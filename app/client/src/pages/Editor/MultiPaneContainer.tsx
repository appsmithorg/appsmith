import React, { useEffect } from "react";
import styled from "styled-components";
import SideNav, { SIDE_NAV_WIDTH } from "pages/common/SideNav";
import classNames from "classnames";
import BottomBar from "pages/Editor/BottomBar";
import { useDispatch, useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import TabsPane from "pages/Editor/TabsPane";
import { EntityExplorerSidebar } from "components/editorComponents/Sidebar";
import CanvasPane from "pages/Editor/CanvasPane";
import {
  getPaneCount,
  getTabsPaneWidth,
  isMultiPaneActive,
} from "selectors/multiPaneSelectors";
import { setTabsPaneWidth } from "actions/multiPaneActions";
import PropertyPaneContainer from "pages/Editor/WidgetsEditor/PropertyPaneContainer";
import {
  PaneLayoutOptions,
  TABS_PANE_MIN_WIDTH,
} from "reducers/uiReducers/multiPaneReducer";
import useWindowDimensions from "../../utils/hooks/useWindowDimensions";

const Container = styled.div`
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => props.theme.bottomBarHeight}
  );
  background-color: ${(props) => props.theme.appBackground};
`;

const PropertyPanePane = styled.div`
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => props.theme.bottomBarHeight}
  );
  background-color: ${(props) => props.theme.appBackground};
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
`;

const MultiPaneContainer = () => {
  const dispatch = useDispatch();
  const isPreviewMode = useSelector(previewModeSelector);
  const tabsPaneWidth = useSelector(getTabsPaneWidth);
  const [windowWidth] = useWindowDimensions();

  useEffect(() => {
    // Tabs width should be 1/3 of the screen but not less than minimum
    const onLoadWidth = Math.max(
      (windowWidth - SIDE_NAV_WIDTH) / 3,
      TABS_PANE_MIN_WIDTH,
    );
    dispatch(setTabsPaneWidth(onLoadWidth));
  }, []);

  const updatePaneWidth = (width: number) => {
    const newWidth = Math.max(TABS_PANE_MIN_WIDTH, width);
    dispatch(setTabsPaneWidth(newWidth));
  };
  const isMultiPane = useSelector(isMultiPaneActive);
  const paneCount = useSelector(getPaneCount);
  const showPropertyPane = isMultiPane
    ? paneCount === PaneLayoutOptions.THREE_PANE
    : true;
  return (
    <>
      <Container className="relative w-full overflow-x-hidden flex">
        <EntityExplorerSidebar width={250} />
        <SideNav />
        <TabsPane onWidthChange={updatePaneWidth} width={tabsPaneWidth} />
        <CanvasPane />
        {showPropertyPane && (
          <PropertyPanePane>
            <PropertyPaneContainer />
          </PropertyPanePane>
        )}
      </Container>
      <BottomBar
        className={classNames({
          "translate-y-full fixed bottom-0": isPreviewMode,
          "translate-y-0 relative opacity-100": !isPreviewMode,
          "transition-all transform duration-400": true,
        })}
      />
    </>
  );
};

export default MultiPaneContainer;
