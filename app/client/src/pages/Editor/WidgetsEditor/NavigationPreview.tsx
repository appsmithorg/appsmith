import type { LegacyRef } from "react";
import React, { forwardRef } from "react";
import classNames from "classnames";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { Navigation } from "pages/AppViewer/Navigation";
import { useCurrentAppState } from "../IDE/hooks";
import { EditorState } from "@appsmith/entities/IDE/constants";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";

const NavigationPreview = forwardRef(
  (props: unknown, ref: LegacyRef<HTMLDivElement> | undefined) => {
    const isNavigationSelectedInSettings = useSelector(
      getIsAppSettingsPaneWithNavigationTabOpen,
    );
    const appState = useCurrentAppState();
    const isAppSettingsPaneWithNavigationTabOpen =
      appState === EditorState.SETTINGS && isNavigationSelectedInSettings;
    const isPreviewMode = useSelector(combinedPreviewModeSelector);

    return (
      <div
        className={classNames({
          "absolute top-0 z-3 w-full transform bg-gray-50 ease-in t--navigation-preview":
            true,
          "translate-y-0 ease-in transition duration-400":
            isPreviewMode || isAppSettingsPaneWithNavigationTabOpen,
          "-translate-y-full duration-0":
            !isPreviewMode || !isAppSettingsPaneWithNavigationTabOpen,
          "select-none pointer-events-none":
            isAppSettingsPaneWithNavigationTabOpen,
        })}
        ref={ref}
      >
        <Navigation />
      </div>
    );
  },
);

export default NavigationPreview;
