import useMissingModuleNotification from "ee/pages/Editor/IDE/MainPane/useMissingModuleNotification";
import AnonymousDataPopup from "pages/Editor/FirstTimeUserOnboarding/AnonymousDataPopup";
import React from "react";

/**
 * WidgetEditorHeader
 * This component provides the header for the widget editor.
 * It includes the
 * - empty canvas prompts (for new users, and when there are no widgets)
 * - anonymous data popup
 * - missing module notification
 */
export const WidgetEditorHeader = () => {
  const missingModuleNotification = useMissingModuleNotification();
  return (
    <>
      {missingModuleNotification}
      <AnonymousDataPopup />
    </>
  );
};
