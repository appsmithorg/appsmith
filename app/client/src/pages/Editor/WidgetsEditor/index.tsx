import React, { useEffect } from "react";

import WidgetEditorFooter from "components/editorComponents/Debugger";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useSelector } from "react-redux";
import {
  getCurrentPageId,
  getCurrentPageName,
} from "selectors/editorSelectors";

import { WidgetEditorContainer } from "./WidgetEditorContainer";
import { WidgetEditorContent } from "./WidgetEditorContent";
import { WidgetEditorHeader } from "./WidgetEditorHeader";

/**
 * WidgetsEditor
 * This is the main editor component that is used to edit widgets.
 * It includes the
 * - skeleton(wrapper)
 *  - header (empty canvas prompts, anonymous data popup, missing module notification)
 *  - content (navigation, layout based canvas editor, crud generation modal)
 *  - footer (debugger)
 */
function WidgetsEditor() {
  const currentPageId = useSelector(getCurrentPageId);
  const currentPageName = useSelector(getCurrentPageName);
  const currentApp = useSelector(getCurrentApplication);

  useEffect(() => {
    if (currentPageName !== undefined && currentPageId !== undefined) {
      // Logging page load event
      AnalyticsUtil.logEvent("PAGE_LOAD", {
        pageName: currentPageName,
        pageId: currentPageId,
        appName: currentApp?.name,
        mode: "EDIT",
      });
    }
  }, [currentPageName, currentPageId]);

  return (
    <WidgetEditorContainer>
      <WidgetEditorHeader />
      <WidgetEditorContent />
      <WidgetEditorFooter />
    </WidgetEditorContainer>
  );
}

export default WidgetsEditor;
