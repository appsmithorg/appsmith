import React from "react";
import styled from "styled-components";
import SideNav from "pages/common/SideNav";
import classNames from "classnames";
import BottomBar from "pages/Editor/BottomBar";
import { useDispatch, useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import TabsPane from "pages/Editor/TabsPane";
import { EntityExplorerSidebar } from "components/editorComponents/Sidebar";
import CanvasPane from "pages/Editor/CanvasPane";
import { getTabsPaneWidth } from "selectors/multiPaneSelectors";
import { setTabsPaneWidth } from "actions/multiPaneActions";

const Container = styled.div`
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => props.theme.bottomBarHeight}
  );
  background-color: ${(props) => props.theme.appBackground};
`;

const MultiPaneContainer = () => {
  const dispatch = useDispatch();
  const isPreviewMode = useSelector(previewModeSelector);
  const tabsPaneWidth = useSelector(getTabsPaneWidth);
  const updatePaneWidth = (width: number) => dispatch(setTabsPaneWidth(width));
  return (
    <>
      <Container className="relative w-full overflow-x-hidden flex">
        <EntityExplorerSidebar width={250} />
        <SideNav />
        <TabsPane onWidthChange={updatePaneWidth} width={tabsPaneWidth} />
        <CanvasPane />
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
