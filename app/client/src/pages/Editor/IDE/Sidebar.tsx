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
  const [topButtons, setTopButtons] = useState(TopButtons);
  const dispatch = useDispatch();
  const appState = useCurrentAppState();
  const pageId = useSelector(getCurrentPageId);
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const datasources = useSelector(getDatasources);
  const datasourcesExist = datasources.length > 0;

  // Updates the top button config based on datasource existence
  useEffect(() => {
    if (!datasourcesExist) {
      // Update the data button to show a warning
      setTopButtons(
        TopButtons.map((button) => {
          if (button.state === EditorState.DATA) {
            return {
              ...button,
              condition: Condition.Warn,
              tooltip: createMessage(EMPTY_DATASOURCE_TOOLTIP_SIDEBUTTON),
            };
          }
          return button;
        }),
      );
      return;
    }
    // Datasource exists, so reset to standard button config
    setTopButtons(TopButtons);
  }, [datasourcesExist]);

  useEffect(() => {
    dispatch(fetchWorkspace(currentWorkspaceId));
  }, [currentWorkspaceId, dispatch]);

  const onClick = useCallback(
    (suffix) => {
      history.push(
        builderURL({
          pageId,
          suffix,
        }),
        {
          invokedBy: NavigationMethod.AppSidebar,
        },
      );
    },
    [pageId],
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
