type DSDataFilterProps = {
  updateFilter: (
    id: string,
    name: string,
    userPermissions: string[],
    showFilterPane: boolean,
  ) => void;
  pluginType: string;
  showFilterComponent: boolean;
};

function DSDataFilter({}: DSDataFilterProps) {
  return null;
}
export default DSDataFilter;
