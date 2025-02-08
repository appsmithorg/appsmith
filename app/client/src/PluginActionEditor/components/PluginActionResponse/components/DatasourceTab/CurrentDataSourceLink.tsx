import React, { useCallback } from "react";
import { Link } from "@appsmith/ads";
import { CurrentDataSource } from "./CurrentDataSource";
import { useGoToDatasource } from "PluginActionEditor/components/PluginActionResponse/hooks/useGoToDatasource";

const CurrentDataSourceLink = ({
  datasourceId,
  datasourceName,
  pluginId,
}: {
  datasourceId: string;
  datasourceName: string;
  pluginId: string;
}) => {
  const { goToDatasource } = useGoToDatasource();

  const handleClick = useCallback(
    () => goToDatasource(datasourceId),
    [datasourceId, goToDatasource],
  );

  return (
    <Link onClick={handleClick}>
      <CurrentDataSource datasourceName={datasourceName} pluginId={pluginId} />
    </Link>
  );
};

export { CurrentDataSourceLink };
