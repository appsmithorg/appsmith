import React, { useEffect } from "react";
import styled from "styled-components";
import { WidgetProps } from "widgets/NewBaseWidget";
import WidgetFactory from "utils/WidgetFactory";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import AnalyticsUtil from "utils/AnalyticsUtil";

const PageView = styled.div<{ width: number }>`
  height: 100%;
  position: relative;
  width: ${props => props.width}px;
  margin: 0 auto;
`;

type AppPageProps = {
  dsl: ContainerWidgetProps;
  pageName?: string;
  pageId?: string;
};

export const AppPage = (props: AppPageProps) => {
  useEffect(() => {
    AnalyticsUtil.logEvent("PAGE_LOAD", {
      pageName: props.pageName,
      pageId: props.pageId,
      mode: "VIEW",
    });
  }, [props.pageId, props.pageName]);
  const { widgetId, type } = props.dsl;
  return (
    <PageView width={props.dsl.rightColumn}>
      {widgetId && WidgetFactory.createWidget(widgetId)}
    </PageView>
  );
};

export default AppPage;
