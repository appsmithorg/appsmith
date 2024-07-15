import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import history, { NavigationMethod } from "utils/history";
import { useCurrentAppState } from "./hooks";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { IDESidebar, Condition } from "IDE";
import {
  BottomButtons,
  EditorState,
  TopButtons,
} from "@appsmith/entities/IDE/constants";
import { getDatasources } from "@appsmith/selectors/entitiesSelector";
import {
  createMessage,
  EMPTY_DATASOURCE_TOOLTIP_SIDEBUTTON,
} from "@appsmith/constants/messages";

function Sidebar() {
  const dispatch = useDispatch();
  const appState = useCurrentAppState();
  const pageId = useSelector(getCurrentPageId);
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const datasources = useSelector(getDatasources);
  const datasourcesExist = datasources.length > 0;
  const [activePane, setActivePane] = useState<EditorState | null>(null);

  // Updates the top button config based on datasource existence
  const topButtons = React.useMemo(() => {
    return datasourcesExist
      ? TopButtons
      : TopButtons.map((button) => {
          if (button.state === EditorState.DATA) {
            return {
              ...button,
              condition: Condition.Warn,
              tooltip: createMessage(EMPTY_DATASOURCE_TOOLTIP_SIDEBUTTON),
            };
          }
          return button;
        });
  }, [datasourcesExist]);

  useEffect(() => {
    dispatch(fetchWorkspace(currentWorkspaceId));
  }, [currentWorkspaceId, dispatch]);

  const onClick = useCallback(
    (suffix: string, state: EditorState) => {
      if (activePane === state) {
        setActivePane(null);
        history.push(
          builderURL({
            pageId,
            suffix: "",
          }),
          {
            invokedBy: NavigationMethod.AppSidebar,
          },
        );
      } else {
        setActivePane(state);
        history.push(
          builderURL({
            pageId,
            suffix,
          }),
          {
            invokedBy: NavigationMethod.AppSidebar,
          },
        );
      }
    },
    [activePane, pageId],
  );

  return (
    <IDESidebar
      bottomButtons={BottomButtons}
      editorState={appState}
      id={"t--app-sidebar"}
      onClick={onClick}
      topButtons={topButtons}
    />
  );
}

export default Sidebar;
