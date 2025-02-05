import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { builderURL } from "ee/RouteBuilder";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import history, { NavigationMethod } from "utils/history";
import { useCurrentAppState } from "./hooks/useCurrentAppState";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { fetchWorkspace } from "ee/actions/workspaceActions";
import { IDESidebar, Condition } from "@appsmith/ads";
import {
  BottomButtons,
  EditorState,
  TopButtons,
} from "ee/entities/IDE/constants";
import { getDatasources } from "ee/selectors/entitiesSelector";
import {
  createMessage,
  EMPTY_DATASOURCE_TOOLTIP_SIDEBUTTON,
} from "ee/constants/messages";

function Sidebar() {
  const dispatch = useDispatch();
  const appState = useCurrentAppState();
  const basePageId = useSelector(getCurrentBasePageId);
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const datasources = useSelector(getDatasources);
  const datasourcesExist = datasources.length > 0;

  // Updates the bottom button config based on datasource existence
  const bottomButtons = React.useMemo(() => {
    return datasourcesExist
      ? BottomButtons
      : BottomButtons.map((button) => {
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
    (suffix) => {
      history.push(
        builderURL({
          basePageId,
          suffix,
        }),
        {
          invokedBy: NavigationMethod.AppSidebar,
        },
      );
    },
    [basePageId],
  );

  return (
    <IDESidebar
      bottomButtons={bottomButtons}
      editorState={appState}
      id={"t--app-sidebar"}
      onClick={onClick}
      topButtons={TopButtons}
    />
  );
}

export default Sidebar;
