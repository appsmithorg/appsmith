import React, { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { noop } from "lodash";

import Editor from "pages/Editor/QueryEditor/Editor";
import ActionEditorContextMenu from "./ActionEditorContextMenu";
import {
  changeQuery,
  setQueryPaneConfigSelectedTabIndex,
} from "actions/queryPaneActions";
import { getIsPackageEditorInitialized } from "@appsmith/selectors/packageSelectors";
import { QueryEditorContextProvider } from "pages/Editor/QueryEditor/QueryEditorContext";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import {
  getAction,
  getPluginSettingConfigs,
} from "@appsmith/selectors/entitiesSelector";
import { filterWhitelistedConfig } from "./helper";
import { deleteModule, saveModuleName } from "@appsmith/actions/moduleActions";
import type { SaveModuleNamePayload } from "@appsmith/actions/moduleActions";

interface ModuleQueryEditorRouteParams {
  pageId: string; // TODO: @ashit remove this and add generic key in the Editor
  packageId: string;
  moduleId: string;
  queryId?: string;
  apiId?: string;
}

type ModuleQueryEditorProps = RouteComponentProps<ModuleQueryEditorRouteParams>;

function ModuleQueryEditor(props: ModuleQueryEditorProps) {
  const dispatch = useDispatch();
  const { apiId, moduleId, packageId, queryId } = props.match.params;

  const isPackageEditorInitialized = useSelector(getIsPackageEditorInitialized);
  const module = useSelector((state) => getModuleById(state, moduleId));

  const actionId = queryId || apiId || "";
  const action = useSelector((state) => getAction(state, actionId));

  const pluginId = action?.pluginId || "";
  const settingsConfig = useSelector((state) =>
    getPluginSettingConfigs(state, pluginId),
  );

  const whitelistedSettingsConfig = useMemo(() => {
    return filterWhitelistedConfig(
      settingsConfig,
      module?.whitelistedPublicEntitySettingsForModule,
    );
  }, [module?.whitelistedPublicEntitySettingsForModule || [], settingsConfig]);

  useEffect(() => {
    /**
     * This is a hack to set the "Query" tab of the query editor.
     * Reason for hack:
     * 1. In the queryPaneReducer the selectedConfigTabIndex is "0" instead of 0 which makes the condition
     *  selectedConfigTab || EDITOR_TABS.QUERY in EditorJSONtoForm.tsx and nothing get's pre selected.
     * 2. This problem does not occur in App Editor because the contextSwitchingSaga force resets the
     *  selectedConfigTabIndex from "0" to 0 making the above condition work. The logic for context switch is
     *  currently not enabled for package editor.
     *
     * Until the above to problems are resolved then hack will work as a stop gap
     */
    dispatch(setQueryPaneConfigSelectedTabIndex(0 as any));
  }, []);

  const changeQueryPage = (queryId: string) => {
    dispatch(changeQuery({ id: queryId, moduleId, packageId }));
  };

  const onSaveModuleName = useCallback(
    ({ name }: SaveModuleNamePayload) => {
      return saveModuleName({
        id: module?.id || "",
        name,
      });
    },
    [module?.id],
  );

  const onDeleteModule = useCallback(() => {
    dispatch(deleteModule({ id: module?.id || "" }));
  }, [module?.id]);

  const moreActionsMenu = useMemo(() => {
    return (
      <ActionEditorContextMenu isDeletePermitted onDelete={onDeleteModule} />
    );
  }, []);

  return (
    <QueryEditorContextProvider
      changeQueryPage={changeQueryPage}
      moreActionsMenu={moreActionsMenu}
      onCreateDatasourceClick={noop}
      onEntityNotFoundBackClick={noop}
      saveActionName={onSaveModuleName}
    >
      <Editor
        {...props}
        isEditorInitialized={isPackageEditorInitialized}
        settingsConfig={whitelistedSettingsConfig}
      />
    </QueryEditorContextProvider>
  );
}

export default ModuleQueryEditor;
