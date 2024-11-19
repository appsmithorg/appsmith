import { useCallback } from "react";

import { datasourcesEditorIdURL, integrationEditorURL } from "ee/RouteBuilder";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import history from "utils/history";
import { DatasourceCreateEntryPoints } from "constants/Datasource";

function useDataSourceNavigation() {
  const goToDatasource = useCallback((datasourceId: string) => {
    history.push(datasourcesEditorIdURL({ datasourceId }));
  }, []);

  const onCreateDatasourceClick = useCallback(
    (
      selectedTab,
      pageId?: string,
      entryPoint: string = DatasourceCreateEntryPoints.QUERY_EDITOR,
    ) => {
      history.push(
        integrationEditorURL({
          basePageId: pageId,
          selectedTab,
        }),
      );

      AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
        entryPoint,
      });
    },
    [],
  );

  return { goToDatasource, onCreateDatasourceClick };
}

export { useDataSourceNavigation };
