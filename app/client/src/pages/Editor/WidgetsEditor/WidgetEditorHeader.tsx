import MissingModuleNotification from "ee/pages/AppIDE/components/MissingModuleNotification";
import AnonymousDataPopup from "pages/Editor/FirstTimeUserOnboarding/AnonymousDataPopup";
import React from "react";

/**
 * WidgetEditorHeader
 * This component provides the header for the widget editor.
 * It includes the
 * - anonymous data popup
 * - missing module notification
 */
export const WidgetEditorHeader = () => {
  return (
    <>
      <MissingModuleNotification />
      <AnonymousDataPopup />
    </>
  );
};
