import React, { useEffect } from "react";
import styled from "styled-components";
import WidgetFactory from "utils/WidgetFactory";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import { DSLWidget } from "widgets/constants";
import { RenderModes } from "constants/WidgetConstants";

const PageView = styled.div<{ width: number }>`
  height: 100%;
  position: relative;
  width: ${(props) => props.width}px;
  margin: 0 auto;
`;

type AppPageProps = {
  dsl: DSLWidget;
  pageName?: string;
  pageId?: string;
  appName?: string;
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
    <PageView className="t--app-viewer-page" width={props.dsl.rightColumn}>
      {props.dsl.widgetId &&
        WidgetFactory.createWidget(props.dsl, RenderModes.PAGE)}
    </PageView>
  );
}

export default AppPage;
