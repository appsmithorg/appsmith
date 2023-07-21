import { DEFAULT_ENV_ID } from "@appsmith/api/ApiUtils";
import type { AppState } from "@appsmith/reducers";
import { getEnvironmentById } from "@appsmith/selectors/environmentSelectors";
import { getCurrentEnvironment } from "@appsmith/utils/Environments";
import { useEffect } from "react";
import { useSelector } from "react-redux";

type DSDataFilterProps = {
  datasourceId: string;
  updateFilter: (
    id: string,
    name: string,
    userPermissions: string[],
    showFilterPane: boolean,
  ) => boolean;
  pluginType: string;
  pluginName: string;
  isInsideReconnectModal: boolean;
  viewMode: boolean;
  filterId: string; // id of the selected environment, used to keep the parent and child in sync
};

function DSDataFilter({ updateFilter }: DSDataFilterProps) {
  const currentEnv = useSelector((state: AppState) =>
    getEnvironmentById(state, getCurrentEnvironment()),
  );
  useEffect(() => {
    updateFilter(
      currentEnv?.id || DEFAULT_ENV_ID,
      currentEnv?.name || "",
      currentEnv?.userPermissions || [],
      false,
    );
  }, []);
  return null;
}
export default DSDataFilter;
