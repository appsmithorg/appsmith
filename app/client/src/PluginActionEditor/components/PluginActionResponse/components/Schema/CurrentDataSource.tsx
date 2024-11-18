import React, { useCallback } from "react";
import { Flex, Link } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { EntityIcon } from "pages/Editor/Explorer/ExplorerIcons";
import history from "utils/history";
import { datasourcesEditorIdURL } from "ee/RouteBuilder";
import { useSelector } from "react-redux";
import {
  getPluginIdFromDatasourceId,
  getPluginImages,
} from "ee/selectors/entitiesSelector";

interface iProps {
  type: "link" | "trigger";
  datasourceId: string;
  datasourceName: string;
}

const CurrentDataSource = ({ datasourceId, datasourceName, type }: iProps) => {
  const { pluginId, pluginImages } = useSelector((state) => ({
    pluginId: getPluginIdFromDatasourceId(state, datasourceId),
    pluginImages: getPluginImages(state),
  }));

  const goToDatasource = useCallback(() => {
    history.push(datasourcesEditorIdURL({ datasourceId }));
  }, [datasourceId]);

  const datasourceIcon = pluginId ? pluginImages?.[pluginId] : undefined;

  const content = (
    <Flex
      alignItems="center"
      gap="spaces-2"
      justifyContent={type === "link" ? "center" : "start"}
    >
      <EntityIcon height="16px" width="16px">
        <img alt="entityIcon" src={getAssetUrl(datasourceIcon)} />
      </EntityIcon>
      {datasourceName}
    </Flex>
  );

  return type === "link" ? (
    <Link onClick={goToDatasource}>{content}</Link>
  ) : (
    content
  );
};

export { CurrentDataSource };
