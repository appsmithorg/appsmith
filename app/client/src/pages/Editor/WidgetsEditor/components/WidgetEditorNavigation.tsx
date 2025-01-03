import React, { forwardRef, useEffect, useRef, useState } from "react";
import NavigationPreview from "./NavigationPreview";
import { EditorState } from "ee/entities/IDE/constants";
import { useCurrentAppState } from "pages/Editor/IDE/hooks/useCurrentAppState";
import {
  getAppSettingsPaneContext,
  getIsAppSettingsPaneWithNavigationTabOpen,
} from "selectors/appSettingsPaneSelectors";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";

/**
 * useNavigationPreviewHeight
 * This hook is used to get the height of the navigation preview and the ref to the navigation preview
 *
 * @returns navigationPreviewRef: Ref to the navigation preview
 * @returns navigationHeight: Height of the navigation preview
 */
export const useNavigationPreviewHeight = () => {
  const [navigationHeight, setNavigationHeight] = useState(0);
  const navigationPreviewRef = useRef(null);
  const isPreviewMode = useSelector(combinedPreviewModeSelector);
  const appSettingsPaneContext = useSelector(getAppSettingsPaneContext);
  const currentApplicationDetails = useSelector(getCurrentApplication);

  useEffect(() => {
    if (navigationPreviewRef?.current) {
      const { offsetHeight } = navigationPreviewRef.current;

      setNavigationHeight(offsetHeight);
    } else {
      setNavigationHeight(0);
    }
  }, [
    navigationPreviewRef,
    isPreviewMode,
    appSettingsPaneContext?.type,
    currentApplicationDetails?.applicationDetail?.navigationSetting,
  ]);

  return {
    navigationPreviewRef,
    navigationHeight,
  };
};

type DivRef = React.Ref<HTMLDivElement>;
/**
 * WidgetEditorNavigation
 *
 * This component is used to render the navigation preview in the widget editor.
 * It is shown when the user is in preview mode or when the navigation tab is selected in the app settings pane.
 */
export const WidgetEditorNavigation = forwardRef(
  (props, navigationPreviewRef: DivRef) => {
    const isPreviewMode = useSelector(combinedPreviewModeSelector);
    const isNavigationSelectedInSettings = useSelector(
      getIsAppSettingsPaneWithNavigationTabOpen,
    );
    const appState = useCurrentAppState();
    const isAppSettingsPaneWithNavigationTabOpen =
      appState === EditorState.SETTINGS && isNavigationSelectedInSettings;
    const isPreviewingNavigation =
      isPreviewMode || isAppSettingsPaneWithNavigationTabOpen;

    return isPreviewingNavigation ? (
      <NavigationPreview ref={navigationPreviewRef} />
    ) : null;
  },
);
