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
import Canvas from "../Canvas";
import { useParams } from "react-router";
import classNames from "classnames";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { useDispatch } from "react-redux";
import {
  getAppThemeIsChanging,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import Spinner from "components/ads/Spinner";
import useGoogleFont from "utils/hooks/useGoogleFont";
import { IconSize } from "components/ads/Icon";

const Container = styled.section<{
  background: string;
}>`
  width: 100%;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  background: ${({ background }) => background};
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
  const dispatch = useDispatch();
  const currentPageId = useSelector(getCurrentPageId);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const widgets = useSelector(getCanvasWidgetDsl);
  const pages = useSelector(getViewModePageList);
  const isPreviewMode = useSelector(previewModeSelector);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const shouldHaveTopMargin = !isPreviewMode || pages.length > 1;
  const isAppThemeChanging = useSelector(getAppThemeIsChanging);

  useEffect(() => {
    return () => {
      dispatch(forceOpenWidgetPanel(false));
    };
  }, []);

  const fontFamily = useGoogleFont(selectedTheme.properties.fontFamily.appFont);

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

  return (
    <Container
      background={
        isPreviewMode
          ? selectedTheme.properties.colors.backgroundColor
          : "initial"
      }
      className={classNames({
        [`${getCanvasClassName()} scrollbar-thin`]: true,
        "mt-0": !shouldHaveTopMargin,
        "mt-8": shouldHaveTopMargin,
      })}
      key={currentPageId}
      style={{
        height: `calc(100% - ${shouldHaveTopMargin ? "2rem" : "0px"})`,
        fontFamily: fontFamily,
      }}
    >
      {isAppThemeChanging && (
        <div className="fixed top-0 bottom-0 left-0 right-0 flex items-center justify-center bg-white z-2 bg-opacity-70">
          <Spinner size={IconSize.XXL} />
        </div>
      )}
      {node}
    </Container>
  );
}

export default CanvasContainer;
