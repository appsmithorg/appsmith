import { generateSchema } from "actions/pluginActionActions";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import { useCallback } from "react";
import { useDispatch } from "react-redux";

function useHandleGenerateSchemaClick() {
  const { action } = usePluginActionContext();
  const dispatch = useDispatch();

  const handleGenerateSchemaClick = useCallback(() => {
    dispatch(generateSchema(action?.id ?? ""));
  }, [action?.id, dispatch]);

  return { handleGenerateSchemaClick };
}

export { useHandleGenerateSchemaClick };
