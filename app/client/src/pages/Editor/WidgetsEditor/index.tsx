import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import WidgetEditorFooter from "components/editorComponents/Debugger";
import {
  getCurrentPageId,
  getCurrentPageName,
} from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import { WidgetEditorSkeleton } from "./WidgetEditorSkeleton";
import { WidgetEditorHeader } from "./WidgetEditorHeader";
import { WidgetEditorContent } from "./WidgetEditorContent";

function WidgetsEditor() {
  const currentPageId = useSelector(getCurrentPageId);
  const currentPageName = useSelector(getCurrentPageName);
  const currentApp = useSelector(getCurrentApplication);

  useEffect(() => {
    PerformanceTracker.stopTracking(PerformanceTransactionName.CLOSE_SIDE_PANE);
  });

  // log page load
  useEffect(() => {
    if (currentPageName !== undefined && currentPageId !== undefined) {
      AnalyticsUtil.logEvent("PAGE_LOAD", {
        pageName: currentPageName,
        pageId: currentPageId,
        appName: currentApp?.name,
        mode: "EDIT",
      });
    }
  }, [currentPageName, currentPageId]);

  PerformanceTracker.stopTracking();
  return (
    <WidgetEditorSkeleton>
      <WidgetEditorHeader />
      <WidgetEditorContent />
      <WidgetEditorFooter />
    </WidgetEditorSkeleton>
  );
}

export default WidgetsEditor;
