import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import type { ReactNode } from "react";
import React from "react";
import classNames from "classnames";
import { useCurrentAppState } from "../IDE/hooks";
import { useSelector } from "react-redux";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { EditorState } from "@appsmith/entities/IDE/constants";

export const WidgetEditorSkeleton = (props: { children: ReactNode }) => {
  const isNavigationSelectedInSettings = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const appState = useCurrentAppState();
  const isAppSettingsPaneWithNavigationTabOpen =
    appState === EditorState.SETTINGS && isNavigationSelectedInSettings;
  return (
    <EditorContextProvider renderMode="CANVAS">
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
