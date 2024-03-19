import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import type { ReactNode } from "react";
import React from "react";
import classNames from "classnames";
import { useCurrentAppState } from "pages/Editor/IDE/hooks";
import { useSelector } from "react-redux";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { EditorState } from "@appsmith/entities/IDE/constants";
import { RenderModes } from "constants/WidgetConstants";

/**
 * WidgetEditorContainer
 * This component is used to provide proper layout for the widget editor components like header, content, and footer.
 */
export const WidgetEditorContainer = (props: { children: ReactNode }) => {
  const isNavigationSelectedInSettings = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const appState = useCurrentAppState();
  const isAppSettingsPaneWithNavigationTabOpen =
    appState === EditorState.SETTINGS && isNavigationSelectedInSettings;
  return (
    <EditorContextProvider renderMode={RenderModes.CANVAS}>
      <div className="relative flex flex-row h-full w-full overflow-hidden">
        <div
          className={classNames({
            "relative flex flex-col w-full overflow-hidden": true,
            "m-8 border border-gray-200":
              isAppSettingsPaneWithNavigationTabOpen,
          })}
        >
          {props.children}
        </div>
      </div>
    </EditorContextProvider>
  );
};
