import React, { useEffect } from "react";
import styled from "styled-components";
import { WidgetProps } from "widgets/BaseWidget";
import { RenderModes } from "constants/WidgetConstants";
import WidgetFactory from "utils/WidgetFactory";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";

const PageView = styled.div<{ width: number }>`
  height: 100%;
  position: relative;
  width: ${(props) => props.width}px;
  margin: 0 auto;
`;

type AppPageProps = {
  dsl: ContainerWidgetProps<WidgetProps>;
  pageName?: string;
  pageId?: string;
  appName?: string;
};

export const AppPage = (props: AppPageProps) => {
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
    <PageView width={props.dsl.rightColumn}>
      {props.dsl.widgetId &&
        WidgetFactory.createWidget(props.dsl, RenderModes.PAGE)}
    </PageView>
  );
};

export default AppPage;
