import { QueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm";
import { useCallback, useContext } from "react";

export function useTableHeaderIndex() {
  const { config, updateConfig } = useContext(QueryGeneratorFormContext);

  const onChange = useCallback((value) => {
    updateConfig("tableHeaderIndex", value);
  }, []);

  return {
    value: config.tableHeaderIndex,
    onChange,
  };
}
