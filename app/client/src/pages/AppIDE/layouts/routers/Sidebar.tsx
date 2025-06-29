import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { builderURL } from "ee/RouteBuilder";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import history, { NavigationMethod } from "utils/history";
import { useCurrentAppState } from "IDE/hooks/useCurrentAppState";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { fetchWorkspace } from "ee/actions/workspaceActions";
import { IDESidebar } from "@appsmith/ads";
import { getDatasources } from "ee/selectors/entitiesSelector";
import {
  BottomButtons,
  TopButtons,
} from "ee/pages/AppIDE/constants/SidebarButtons";
import { getIsAiAgentApp } from "ee/selectors/aiAgentSelectors";

function Sidebar() {
  const dispatch = useDispatch();
  const appState = useCurrentAppState();
  const basePageId = useSelector(getCurrentBasePageId);
  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);
  const datasources = useSelector(getDatasources);
  const datasourcesExist = datasources.length > 0;
  const isAgentApp = useSelector(getIsAiAgentApp);

  // Updates the bottom button config based on datasource existence
  const bottomButtons = React.useMemo(() => {
    return BottomButtons(datasourcesExist, isAgentApp);
  }, [datasourcesExist, isAgentApp]);

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
