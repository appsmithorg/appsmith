import React, { ReactNode, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  getCurrentPageId,
  getIsFetchingPage,
  getCanvasWidgetDsl,
  getViewModePageList,
  previewModeSelector,
  themeModeSelector,
} from "selectors/editorSelectors";
import styled from "styled-components";
import webfontloader from "webfontloader";
import { getCanvasClassName } from "utils/generators";

import Centered from "components/designSystems/appsmith/CenteredWrapper";
import { Spinner } from "@blueprintjs/core";
import Canvas from "../Canvas";
import { useParams } from "react-router";
import classNames from "classnames";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";

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

const DEFAULT_FONT_NAME = "System Default";

function CanvasContainer() {
  const currentPageId = useSelector(getCurrentPageId);
  const isFetchingPage = useSelector(getIsFetchingPage);
  const widgets = useSelector(getCanvasWidgetDsl);
  const pages = useSelector(getViewModePageList);
  const isPreviewMode = useSelector(previewModeSelector);
  const isThemeMode = useSelector(themeModeSelector);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const shouldHaveTopMargin =
    (!isPreviewMode || pages.length > 1) && !isThemeMode;

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

  // loads font for canvas based on theme
  useEffect(() => {
    if (selectedTheme.properties.fontFamily.appFont !== DEFAULT_FONT_NAME) {
      webfontloader.load({
        google: {
          families: [selectedTheme.properties.fontFamily.appFont],
        },
      });
    }
  }, [selectedTheme.properties.fontFamily.appFont]);

  /**
   * returns the font to be used for the canvas
   */
  const getAppFontFamily = useMemo(() => {
    if (selectedTheme.properties.fontFamily.appFont === DEFAULT_FONT_NAME) {
      return "inherit";
    }

    return selectedTheme.properties.fontFamily.appFont;
  }, [selectedTheme.properties.fontFamily]);

  return (
    <Container
      className={classNames({
        [`${getCanvasClassName()} scrollbar-thin`]: true,
        "mt-0": !shouldHaveTopMargin,
        "mt-9": shouldHaveTopMargin,
      })}
      key={currentPageId}
      style={{
        height: `calc(100% - ${shouldHaveTopMargin ? "2rem" : "0px"})`,
        fontFamily: getAppFontFamily,
        background:
          isThemeMode || isPreviewMode
            ? selectedTheme.properties.colors.backgroundColor
            : "initial",
      }}
    >
      {node}
    </Container>
  );
}

export default CanvasContainer;
