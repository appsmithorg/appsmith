import { generatePluginActionSchema } from "actions/generateSchemaActions";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import { useCallback } from "react";
import { useDispatch } from "react-redux";

function useHandleGenerateSchemaClick() {
  const { action } = usePluginActionContext();
  const dispatch = useDispatch();

  const handleGenerateSchemaClick = useCallback(() => {
    dispatch(generatePluginActionSchema(action?.id ?? ""));
  }, [action?.id, dispatch]);

  return { handleGenerateSchemaClick };
}

export { useHandleGenerateSchemaClick };
