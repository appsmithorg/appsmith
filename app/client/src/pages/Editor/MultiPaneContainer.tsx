import React from "react";
import styled from "styled-components";
import SideNav from "pages/common/SideNav";
import classNames from "classnames";
import BottomBar from "pages/Editor/BottomBar";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import TabsPane from "pages/Editor/TabsPane";
import { EntityExplorerSidebar } from "components/editorComponents/Sidebar";

const Container = styled.div`
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => props.theme.bottomBarHeight}
  );
  background-color: ${(props) => props.theme.appBackground};
`;

const MultiPaneContainer = () => {
  const isPreviewMode = useSelector(previewModeSelector);
  return (
    <>
      <Container className="relative w-full overflow-x-hidden flex">
        <EntityExplorerSidebar width={200} />
        <SideNav />
        <TabsPane />
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
