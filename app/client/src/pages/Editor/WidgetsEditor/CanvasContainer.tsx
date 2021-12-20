import React, { ReactNode, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  getCurrentPageId,
  getIsFetchingPage,
  getCanvasWidgetDsl,
  getViewModePageList,
  previewModeSelector,
} from "selectors/editorSelectors";
import styled from "styled-components";
import webfontloader from "webfontloader";
import { getCanvasClassName } from "utils/generators";

import Centered from "components/designSystems/appsmith/CenteredWrapper";
import { Spinner } from "@blueprintjs/core";
import Canvas from "../Canvas";
import { useParams } from "react-router";
import classNames from "classnames";
import {
  getPreviewAppTheme,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";

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
  const selectedTheme = useSelector(getSelectedAppTheme);
  const previewTheme = useSelector(getPreviewAppTheme);
  const params = useParams<{ applicationId: string; pageId: string }>();
  const shouldHaveTopMargin = !isPreviewMode || pages.length > 1;

  /**
   * returns the current theme
   * Note: preview theme will take priority over selected theme
   */
  const currentTheme = useMemo(() => {
    return previewTheme ? previewTheme : selectedTheme;
  }, [selectedTheme, previewTheme]);

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
    if (currentTheme.properties.fontFamily.appFont !== DEFAULT_FONT_NAME) {
      webfontloader.load({
        google: {
          families: [
            `${currentTheme.properties.fontFamily.appFont}:300,400,500,700`,
          ],
        },
      });
    }
  }, [currentTheme.properties.fontFamily.appFont]);

  /**
   * returns the font to be used for the canvas
   */
  const getAppFontFamily = useMemo(() => {
    if (currentTheme.properties.fontFamily.appFont === DEFAULT_FONT_NAME) {
      return "inherit";
    }

    return currentTheme.properties.fontFamily.appFont;
  }, [currentTheme.properties.fontFamily]);

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
        background: isPreviewMode
          ? currentTheme.properties.colors.backgroundColor
          : "initial",
      }}
    >
      {node}
    </Container>
  );
}

export default CanvasContainer;
