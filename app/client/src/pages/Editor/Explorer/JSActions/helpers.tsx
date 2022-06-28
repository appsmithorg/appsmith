import { useSelector } from "react-redux";
import { getNextEntityName } from "utils/AppsmithUtils";
import { groupBy } from "lodash";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { selectJSCollections } from "selectors/editorSelectors";

export const useNewJSCollectionName = () => {
  const jsCollections = useSelector(selectJSCollections);
  return (
    name: string,
    destinationPageId: string,
    isCopyOperation?: boolean,
  ) => {
    const groupedActions = groupBy(jsCollections, "config.pageId");

    const pageActions = groupedActions[destinationPageId];
    // Get action names of the destination page only
    const actionNames = pageActions
      ? pageActions.map((action: JSCollectionData) => action.config.name)
      : [];

    return actionNames.indexOf(name) > -1
      ? getNextEntityName(
          isCopyOperation ? `${name}Copy` : name,
          actionNames,
          true,
        )
      : name;
  };
};
