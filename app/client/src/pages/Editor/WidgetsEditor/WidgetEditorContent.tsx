import React from "react";

import CrudInfoModal from "pages/Editor/GeneratePage/components/CrudInfoModal";

import { LayoutSystemBasedPageViewer } from "./components/LayoutSystemBasedPageViewer";
import { NavigationAdjustedPageViewer } from "./components/NavigationAdjustedPageViewer";
import { WidgetEditorContentWrapper } from "./components/WidgetEditorContentWrapper";
import {
  WidgetEditorNavigation,
  useNavigationPreviewHeight,
} from "./components/WidgetEditorNavigation";

/**
 * WidgetEditorContent
 * This component orchestrates the rendering of the main content area of the widget editor,
 * which includes navigation, layout based canvas editor, and additional modals like crud generation.
 */
export const WidgetEditorContent = () => {
  const { navigationHeight, navigationPreviewRef } =
    useNavigationPreviewHeight();

  return (
    <WidgetEditorContentWrapper>
      <WidgetEditorNavigation ref={navigationPreviewRef} />
      <NavigationAdjustedPageViewer>
        <LayoutSystemBasedPageViewer navigationHeight={navigationHeight} />
      </NavigationAdjustedPageViewer>
      <CrudInfoModal />
    </WidgetEditorContentWrapper>
  );
};
