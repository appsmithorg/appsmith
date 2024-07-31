import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentBasePageId } from "selectors/editorSelectors";
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
  const basePageId = useSelector(getCurrentBasePageId);
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const datasources = useSelector(getDatasources);
  const datasourcesExist = datasources.length > 0;

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
      bottomButtons={BottomButtons}
      editorState={appState}
      onClick={onClick}
      topButtons={topButtons}
    />
  );
}

export default Sidebar;
