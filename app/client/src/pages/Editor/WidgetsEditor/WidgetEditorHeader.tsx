import React from "react";
import AnonymousDataPopup from "../FirstTimeUserOnboarding/AnonymousDataPopup";
import EmptyCanvasPrompts from "./components/EmptyCanvasPrompts";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { useCurrentAppState } from "../IDE/hooks";
import { EditorState } from "@appsmith/entities/IDE/constants";
import useMissingModuleNotification from "@appsmith/pages/Editor/IDE/MainPane/useMissingModuleNotification";

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
