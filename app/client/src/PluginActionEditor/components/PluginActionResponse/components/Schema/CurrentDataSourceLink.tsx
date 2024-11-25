import React, { useCallback } from "react";
import { Link } from "@appsmith/ads";
import { CurrentDataSource } from "./CurrentDataSource";
import { useGoToDatasource } from "ee/PluginActionEditor/hooks/useGoToDatasource";

const CurrentDataSourceLink = ({
  datasourceId,
  datasourceName,
}: {
  datasourceId: string;
  datasourceName: string;
}) => {
  const { goToDatasource } = useGoToDatasource();

  const handleClick = useCallback(
    () => goToDatasource(datasourceId),
    [datasourceId, goToDatasource],
  );

  return (
    <Link onClick={handleClick}>
      <CurrentDataSource
        datasourceId={datasourceId}
        datasourceName={datasourceName}
      />
    </Link>
  );
};

export { CurrentDataSourceLink };
