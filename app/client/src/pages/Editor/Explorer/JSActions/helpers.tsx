import { useMemo } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getNextEntityName } from "utils/AppsmithUtils";
import { groupBy } from "lodash";
import { JSActionData } from "reducers/entityReducers/jsActionsReducer";

export const useNewJSActionName = () => {
  const jsactions = useSelector((state: AppState) => state.entities.jsActions);
  const groupedActions = useMemo(() => {
    return groupBy(jsactions, "config.pageId");
  }, [jsactions]);
  return (
    name: string,
    destinationPageId: string,
    isCopyOperation?: boolean,
  ) => {
    const pageActions = groupedActions[destinationPageId];
    // Get action names of the destination page only
    const actionNames = pageActions
      ? pageActions.map((action: JSActionData) => action.config.name)
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
