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

function DSDataFilter({}: DSDataFilterProps) {
  return null;
}
export default DSDataFilter;
