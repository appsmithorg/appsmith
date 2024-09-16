import type { LegacyRef } from "react";
import React, { forwardRef } from "react";
import classNames from "classnames";
import { useSelector } from "react-redux";
import { combinedPreviewModeSelector } from "selectors/editorSelectors";
import { Navigation } from "pages/AppViewer/Navigation";
import { useCurrentAppState } from "pages/Editor/IDE/hooks";
import { EditorState } from "ee/entities/IDE/constants";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";

/**
 * NavigationPreview
 *
 * This component is used to provide a preview of the navigation in the widget editor.
 * It is shown when the user is in the preview mode or the app settings pane with the navigation tab open.
 */
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
