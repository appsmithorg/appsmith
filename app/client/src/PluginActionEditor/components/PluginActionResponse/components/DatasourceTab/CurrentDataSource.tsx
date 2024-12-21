import React from "react";
import { Flex, Icon } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { EntityIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { useSelector } from "react-redux";
import { getPluginImages } from "ee/selectors/entitiesSelector";

interface Props {
  datasourceName: string;
  pluginId: string;
}

const CurrentDataSource = ({ datasourceName, pluginId }: Props) => {
  const pluginImages = useSelector((state) => getPluginImages(state));

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
      {datasourceName || "NA"}
    </Flex>
  );
};

export { CurrentDataSource };
