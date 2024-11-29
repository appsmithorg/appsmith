import { useCallback } from "react";
import { datasourcesEditorIdURL } from "ee/RouteBuilder";
import history from "utils/history";

function useGoToDatasource() {
  const goToDatasource = useCallback((datasourceId: string) => {
    history.push(
      datasourcesEditorIdURL({ datasourceId, generateEditorPath: true }),
    );
  }, []);

  return { goToDatasource };
}

export { useGoToDatasource };
