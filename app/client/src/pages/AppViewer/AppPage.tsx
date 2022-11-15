import React, { useEffect } from "react";
import styled from "styled-components";
import WidgetFactory from "utils/WidgetFactory";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useDynamicAppLayout } from "utils/hooks/useDynamicAppLayout";
import { CanvasWidgetStructure } from "widgets/constants";
import { RenderModes } from "constants/WidgetConstants";
import Axios from "axios";

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
  const messageHandler = (event: MessageEvent) => {
    if (event.currentTarget !== window) return;
    if (event.type !== "message") return;
    if (!isValidDomain(event.origin)) return;
    const storeKey = `APPSMITH_LOCAL_STORE-${props.pageId}`;
    const storageKeys = JSON.parse(localStorage.getItem(storeKey) || "{}");
    const data = JSON.parse(event.data);
    for (const key in data) {
      storageKeys[key] = data[key];
    }
    const storeString = JSON.stringify(storageKeys);
    localStorage.setItem(storeKey, storeString);
  };
  useEffect(() => {
    // add postmessage
    window.addEventListener("message", messageHandler);
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

function isValidDomain(domain: string): boolean {
  const regex1 = new RegExp("/(.+?)[.]manabie.com$");
  const regex2 = new RegExp("/(.+?)[.]web.app$");
  const regex3 = new RegExp("/(.+?)[.]manabie.io$");
  const regex4 = new RegExp("/(.+?)[.]manabie.net$");
  if (
    (window.location.origin == "http://localhost" ||
      window.location.origin ==
        "https://appsmith.local-green.manabie.io:31600" ||
      regex3.test(window.location.origin)) &&
    domain.indexOf("localhost") > -1
  ) {
    return true;
  }

  if (
    regex1.test(domain) ||
    regex2.test(domain) ||
    regex3.test(domain) ||
    regex4.test(domain)
  ) {
    return true;
  }
  return false;
}
export default AppPage;
