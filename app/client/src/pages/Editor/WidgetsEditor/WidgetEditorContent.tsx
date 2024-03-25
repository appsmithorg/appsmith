import React from "react";
import {
  WidgetEditorNavigation,
  useNavigationPreviewHeight,
} from "./components/WidgetEditorNavigation";
import CrudInfoModal from "pages/Editor/GeneratePage/components/CrudInfoModal";
import { WidgetEditorContentWrapper } from "./components/WidgetEditorContentWrapper";
import { NavigationAdjustedPageViewer } from "./components/NavigationAdjustedPageViewer";
import { LayoutSystemBasedPageViewer } from "./components/LayoutSystemBasedPageViewer";

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
