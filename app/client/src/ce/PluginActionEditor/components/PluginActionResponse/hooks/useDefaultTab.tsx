import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import { PluginType } from "entities/Action";
import { usePluginActionContext } from "PluginActionEditor";
import useShowSchema from "PluginActionEditor/components/PluginActionResponse/hooks/useShowSchema";
import {
  getPluginActionDebuggerState,
  setPluginActionEditorDebuggerState,
} from "PluginActionEditor/store";
import { doesPluginRequireDatasource } from "ee/entities/Engine/actionHelpers";

export function useDefaultTab() {
  const dispatch = useDispatch();
  const { plugin } = usePluginActionContext();
  const pluginRequireDatasource = doesPluginRequireDatasource(plugin);
  const showSchema = useShowSchema(plugin?.id || "") && pluginRequireDatasource;
  const { selectedTab } = useSelector(getPluginActionDebuggerState);

  useEffect(
    function openDefaultTabWhenNoTabIsSelected() {
      if (showSchema && !selectedTab) {
        dispatch(
          setPluginActionEditorDebuggerState({
            open: true,
            selectedTab: DEBUGGER_TAB_KEYS.DATASOURCE_TAB,
          }),
        );
      } else if (plugin.type === PluginType.API && !selectedTab) {
        dispatch(
          setPluginActionEditorDebuggerState({
            open: true,
            selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
          }),
        );
      }
    },
    [showSchema, selectedTab, dispatch, plugin.type],
  );
}
