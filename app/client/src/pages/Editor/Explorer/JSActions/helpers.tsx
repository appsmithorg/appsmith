import { getNextEntityName } from "utils/AppsmithUtils";
import { groupBy } from "lodash";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { selectJSCollections } from "selectors/editorSelectors";
import store from "store";

export const getJSEntityName = () => {
  const state = store.getState();
  const jsCollections = selectJSCollections(state);
  return (
    name: string,
    destinationPageId: string,
    isCopyOperation?: boolean,
  ) => {
    const groupedActions = groupBy(jsCollections, "config.pageId");
    const pageActions = groupedActions[destinationPageId] || [];
    const actionNames = pageActions.map(
      (action: JSCollectionData) => action.config.name,
    );
    return actionNames.indexOf(name) > -1
      ? getNextEntityName(
          isCopyOperation ? `${name}Copy` : name,
          actionNames,
          true,
        )
      : name;
  };
};
