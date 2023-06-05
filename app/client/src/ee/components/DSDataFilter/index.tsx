type DSDataFilterProps = {
  updateFilter: (
    id: string,
    name: string,
    userPermissions: string[],
    showFilterPane: boolean,
  ) => void;
  pluginType: string;
  isInsideReconnectModal: boolean;
  viewMode: boolean;
};

function DSDataFilter({}: DSDataFilterProps) {
  return null;
}
export default DSDataFilter;
