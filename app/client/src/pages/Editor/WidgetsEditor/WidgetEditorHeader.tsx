import React from "react";
import AnonymousDataPopup from "pages/Editor/FirstTimeUserOnboarding/AnonymousDataPopup";
import EmptyCanvasPrompts from "./components/EmptyCanvasPrompts";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { useCurrentAppState } from "pages/Editor/IDE/hooks";
import { EditorState } from "@appsmith/entities/IDE/constants";
import useMissingModuleNotification from "@appsmith/pages/Editor/IDE/MainPane/useMissingModuleNotification";

/**
 * WidgetEditorHeader
 * This component provides the header for the widget editor.
 * It includes the
 * - empty canvas prompts (for new users, and when there are no widgets)
 * - anonymous data popup
 * - missing module notification
 */
export const WidgetEditorHeader = () => {
  const isNavigationSelectedInSettings = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const appState = useCurrentAppState();
  const isAppSettingsPaneWithNavigationTabOpen =
    appState === EditorState.SETTINGS && isNavigationSelectedInSettings;
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const missingModuleNotification = useMissingModuleNotification();
  return (
    <>
      {!isAppSettingsPaneWithNavigationTabOpen && (
        <EmptyCanvasPrompts isPreview={isPreviewMode} />
      )}
      {missingModuleNotification}
      <AnonymousDataPopup />
    </>
  );
};
