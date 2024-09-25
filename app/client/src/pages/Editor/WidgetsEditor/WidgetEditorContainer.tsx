import EditorContextProvider from "components/editorComponents/EditorContextProvider";
import type { ReactNode } from "react";
import React from "react";
import classNames from "classnames";
import { useCurrentAppState } from "pages/Editor/IDE/hooks";
import { useSelector } from "react-redux";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { EditorState } from "ee/entities/IDE/constants";
import { RenderModes } from "constants/WidgetConstants";
import styled from "styled-components";
import { IDE_HEADER_HEIGHT } from "IDE";
import { BOTTOM_BAR_HEIGHT } from "components/BottomBar/constants";

const Container = styled.div`
  height: calc(100vh - ${IDE_HEADER_HEIGHT} - ${BOTTOM_BAR_HEIGHT});
`;

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
      <Container className="relative flex flex-row h-full w-full overflow-hidden">
        <div
          className={classNames({
            "relative flex flex-col w-full overflow-hidden": true,
            "m-8 border border-gray-200":
              isAppSettingsPaneWithNavigationTabOpen,
          })}
        >
          {props.children}
        </div>
      </Container>
    </EditorContextProvider>
  );
};
