import { useSelector } from "react-redux";
import { getConfigTree, getDataTree } from "selectors/dataTreeSelectors";
import { getJSCollections } from "ee/selectors/entitiesSelector";
import { useMemo } from "react";
import { filterInternalProperties } from "utils/FilterInternalProperties";

export function useGetDisplayData(selectedItemName: string) {
  const dataTree = useSelector(getDataTree);
  const configTree = useSelector(getConfigTree);
  const jsActions = useSelector(getJSCollections);

  return useMemo(() => {
    if (selectedItemName in dataTree) {
      return filterInternalProperties(
        selectedItemName,
        dataTree[selectedItemName],
        jsActions,
        dataTree,
        configTree,
      );
    }

    return "";
  }, [configTree, dataTree, jsActions, selectedItemName]);
}
