import React from "react";
import { Button, Flex, Tooltip } from "@appsmith/ads";
import DatasourceSelector from "./DatasourceSelector";
import { createMessage, EDIT_DS_CONFIG } from "ee/constants/messages";
import { DatasourceEditEntryPoints } from "constants/Datasource";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { datasourcesEditorIdURL } from "ee/RouteBuilder";
import { omit } from "lodash";
import { getQueryParams } from "utils/URLUtils";
import history from "utils/history";
import { useParentEntityInfo } from "ee/IDE/hooks/useParentEntityInfo";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import type { Plugin } from "entities/Plugin";

interface Props {
  datasourceId: string;
  datasourceName: string;
  showEditButton: boolean;
  plugin?: Plugin;
}

const DatasourceInfo = ({
  datasourceId,
  datasourceName,
  plugin,
  showEditButton,
}: Props) => {
  const ideType = getIDETypeByUrl(location.pathname);
  const { parentEntityId } = useParentEntityInfo(ideType);

  // eslint-disable-next-line react-perf/jsx-no-new-function-as-prop
  const editDatasource = () => {
    const entryPoint = DatasourceEditEntryPoints.QUERY_EDITOR_DATASOURCE_SCHEMA;

    AnalyticsUtil.logEvent("EDIT_DATASOURCE_CLICK", {
      datasourceId: datasourceId,
      pluginName: "",
      entryPoint: entryPoint,
    });

    const url = datasourcesEditorIdURL({
      baseParentEntityId: parentEntityId,
      datasourceId: datasourceId,
      params: { ...omit(getQueryParams(), "viewMode"), viewMode: false },
      generateEditorPath: true,
    });

    history.push(url);
  };

  return (
    <Flex alignItems={"center"} gap="spaces-2">
      <DatasourceSelector
        datasourceId={datasourceId}
        datasourceName={datasourceName}
        plugin={plugin}
      />
      {showEditButton && datasourceName && (
        <Tooltip content={createMessage(EDIT_DS_CONFIG)} placement="top">
          <Button
            isIconButton
            kind="tertiary"
            onClick={editDatasource}
            size="sm"
            startIcon="datasource-config"
          />
        </Tooltip>
      )}
    </Flex>
  );
};

export default DatasourceInfo;
