import React from "react";
import { Flex, Icon } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { EntityIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { useSelector } from "react-redux";
import {
  getPluginIdFromDatasourceId,
  getPluginImages,
} from "ee/selectors/entitiesSelector";
import { createMessage, SELECT_DATASOURCE } from "ee/constants/messages";

interface Props {
  datasourceId: string;
  datasourceName: string;
}

const CurrentDataSource = ({ datasourceId, datasourceName }: Props) => {
  const { pluginId, pluginImages } = useSelector((state) => ({
    pluginId: getPluginIdFromDatasourceId(state, datasourceId),
    pluginImages: getPluginImages(state),
  }));

  const datasourceIcon = pluginId ? pluginImages?.[pluginId] : undefined;

  return (
    <Flex alignItems="center" gap="spaces-2">
      <EntityIcon height="16px" width="16px">
        {datasourceIcon ? (
          <img alt="entityIcon" src={getAssetUrl(datasourceIcon)} />
        ) : (
          <Icon name="datasource-v3" />
        )}
      </EntityIcon>
      {datasourceName || createMessage(SELECT_DATASOURCE)}
    </Flex>
  );
};

export { CurrentDataSource };
