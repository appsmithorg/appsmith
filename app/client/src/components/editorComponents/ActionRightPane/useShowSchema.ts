import {
  getPluginDatasourceComponentFromId,
  getPluginNameFromId,
} from "ee/selectors/entitiesSelector";
import { DatasourceComponentTypes } from "api/PluginApi";
import { SCHEMALESS_PLUGINS } from "pages/Editor/DatasourceInfo/DatasourceStructureContainer";
import { useSelector } from "react-redux";

function useShowSchema(pluginId: string) {
  const pluginDatasourceForm = useSelector((state) =>
    getPluginDatasourceComponentFromId(state, pluginId),
  );

  const pluginName = useSelector((state) =>
    getPluginNameFromId(state, pluginId),
  );

  return (
    pluginDatasourceForm !== DatasourceComponentTypes.RestAPIDatasourceForm &&
    !SCHEMALESS_PLUGINS.includes(pluginName)
  );
}

export default useShowSchema;
