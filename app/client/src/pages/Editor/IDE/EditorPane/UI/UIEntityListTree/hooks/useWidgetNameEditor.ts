import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { updateWidgetName } from "actions/propertyPaneActions";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const useWidgetNameEditor = (widgetId: string) => {
  const dispatch = useDispatch();

  const handleNameSave = useCallback(
    (newName: string) => {
      dispatch(updateWidgetName(widgetId, newName));
    },
    [dispatch, widgetId],
  );

  const enterEditMode = useCallback(() => {
    dispatch(initExplorerEntityNameEdit(widgetId));
  }, [dispatch, widgetId]);

  const exitEditMode = useCallback(() => {
    dispatch({
      type: ReduxActionTypes.END_EXPLORER_ENTITY_NAME_EDIT,
    });
  }, [dispatch]);

  return {
    handleNameSave,
    enterEditMode,
    exitEditMode,
  };
};
