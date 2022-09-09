import React, { useEffect } from "react";
import styled from "styled-components";
import WidgetFactory from "utils/WidgetFactory";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import { CanvasWidgetStructure } from "widgets/constants";
import { RenderModes } from "constants/WidgetConstants";

const PageView = styled.div<{ width: number }>`
  height: 100%;
  position: relative;
  width: ${(props) => props.width}px;
  margin: 0 auto;
`;

type AppPageProps = {
  appName?: string;
  canvasWidth: number;
  pageId?: string;
  pageName?: string;
  widgetsStructure: CanvasWidgetStructure;
};

export function AppPage(props: AppPageProps) {
  useDynamicAppLayout();

  useEffect(() => {
    AnalyticsUtil.logEvent("PAGE_LOAD", {
      pageName: props.pageName,
      pageId: props.pageId,
      appName: props.appName,
      mode: "VIEW",
    });
  }, [props.pageId, props.pageName]);

  return (
    <PageView className="t--app-viewer-page" width={props.canvasWidth}>
      {props.widgetsStructure.widgetId &&
        WidgetFactory.createWidget(props.widgetsStructure, RenderModes.PAGE)}
    </PageView>
  );
}

export default AppPage;
