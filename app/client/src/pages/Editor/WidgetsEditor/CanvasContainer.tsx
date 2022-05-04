import React, { ReactNode, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  getCurrentPageId,
  getIsFetchingPage,
  getCanvasWidgetDsl,
  getViewModePageList,
  previewModeSelector,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { getCanvasClassName } from "utils/generators";

import Centered from "components/designSystems/appsmith/CenteredWrapper";
import { Spinner } from "@blueprintjs/core";
import Canvas from "../Canvas";
import { useParams } from "react-router";
import classNames from "classnames";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { useDispatch } from "react-redux";
import { getCurrentThemeDetails } from "selectors/themeSelectors";

const Container = styled.section`
  width: 100%;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  &:before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
`;

function CanvasContainer() {
  const currentPageId = useSelector(getCurrentPageId);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const widgets = useSelector(getCanvasWidgetDsl);
  const pages = useSelector(getViewModePageList);
  const theme = useSelector(getCurrentThemeDetails);
  const isPreviewMode = useSelector(previewModeSelector);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const shouldHaveTopMargin = !isPreviewMode || pages.length > 1;
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(forceOpenWidgetPanel(false));
    };
  }, []);

  const pageLoading = (
    <Centered>
      <Spinner />
    </Centered>
  );
  let node: ReactNode;

  if (isFetchingPage) {
    node = pageLoading;
  }

  if (!isFetchingPage && widgets) {
    node = <Canvas dsl={widgets} pageId={params.pageId} />;
  }
  // calculating exact height to not allow scroll at this component,
  // calculating total height minus margin on top, top bar and bottom bar
  const heightWithTopMargin = `calc(100vh - 2.25rem - ${theme.smallHeaderHeight} - ${theme.bottomBarHeight})`;
  return (
    <Container
      className={classNames({
        [`${getCanvasClassName()} scrollbar-thin`]: true,
        "mt-0": !shouldHaveTopMargin,
        "mt-9": shouldHaveTopMargin,
      })}
      key={currentPageId}
      style={{
        height: shouldHaveTopMargin ? heightWithTopMargin : "100vh",
      }}
    >
      {node}
    </Container>
  );
}

export default CanvasContainer;
