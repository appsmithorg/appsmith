import { useCallback } from "react";
import { integrationEditorURL } from "ee/RouteBuilder";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import history from "utils/history";

function useCreateDatasource() {
  const onCreateDatasourceClick = useCallback(
    (selectedTab, pageId?: string) => {
      history.push(
        integrationEditorURL({
          basePageId: pageId,
          selectedTab,
        }),
      );

      AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
        entryPoint: DatasourceCreateEntryPoints.QUERY_EDITOR,
      });
    },
    [],
  );

  return { onCreateDatasourceClick };
}

export { useCreateDatasource };
