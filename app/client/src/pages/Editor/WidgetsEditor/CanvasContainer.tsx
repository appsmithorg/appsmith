import React, { ReactNode, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  getCurrentPageId,
  getIsFetchingPage,
  getViewModePageList,
  previewModeSelector,
  getCanvasWidth,
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
import { Spinner } from "design-system";
import useGoogleFont from "utils/hooks/useGoogleFont";
import { IconSize } from "design-system";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { getCanvasWidgetsStructure } from "selectors/entitiesSelector";
import equal from "fast-deep-equal/es6";
import { WidgetGlobaStyles } from "globalStyles/WidgetGlobalStyles";

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
  const canvasWidth = useSelector(getCanvasWidth);
  const widgetsStructure = useSelector(getCanvasWidgetsStructure, equal);
  const pages = useSelector(getViewModePageList);
  const theme = useSelector(getCurrentThemeDetails);
  const isPreviewMode = useSelector(previewModeSelector);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const shouldHaveTopMargin = !isPreviewMode || pages.length > 1;
  const isAppThemeChanging = useSelector(getAppThemeIsChanging);

  const isLayoutingInitialized = useDynamicAppLayout();
  const isPageInitializing = isFetchingPage || !isLayoutingInitialized;

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

  if (isPageInitializing) {
    node = pageLoading;
  }

  if (!isPageInitializing && widgetsStructure) {
    node = (
      <Canvas
        canvasWidth={canvasWidth}
        pageId={params.pageId}
        widgetsStructure={widgetsStructure}
      />
    );
  }
  // calculating exact height to not allow scroll at this component,
  // calculating total height minus margin on top, top bar and bottom bar
  const heightWithTopMargin = `calc(100vh - 2.25rem - ${theme.smallHeaderHeight} - ${theme.bottomBarHeight})`;
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
        height: shouldHaveTopMargin ? heightWithTopMargin : "100vh",
        fontFamily: fontFamily,
      }}
    >
      <WidgetGlobaStyles
        fontFamily={selectedTheme.properties.fontFamily.appFont}
        primaryColor={selectedTheme.properties.colors.primaryColor}
      />
      {isAppThemeChanging && (
        <div className="fixed top-0 bottom-0 left-0 right-0 flex items-center justify-center bg-white/70 z-[2]">
          <Spinner size={IconSize.XXL} />
        </div>
      )}
      {node}
    </Container>
  );
}

export default CanvasContainer;
