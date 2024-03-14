import React, { forwardRef, useEffect, useRef, useState } from "react";
import NavigationPreview from "./NavigationPreview";
import { EditorState } from "@appsmith/entities/IDE/constants";
import { useCurrentAppState } from "../../IDE/hooks";
import {
  getAppSettingsPaneContext,
  getIsAppSettingsPaneWithNavigationTabOpen,
} from "selectors/appSettingsPaneSelectors";
import { useSelector } from "react-redux";
import {
  combinedPreviewModeSelector,
  getCurrentApplication,
} from "selectors/editorSelectors";

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
