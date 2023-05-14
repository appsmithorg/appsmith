import React from "react";
import styled from "styled-components";
import SideNav from "pages/common/SideNav";
import classNames from "classnames";
import BottomBar from "@appsmith/components/BottomBar";
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
import { PaneLayoutOptions } from "reducers/uiReducers/multiPaneReducer";

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
  const updatePaneWidth = (width: number) => dispatch(setTabsPaneWidth(width));
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
