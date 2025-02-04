import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  getUpdatingEntity,
  getEditingEntityName,
} from "selectors/explorerSelector";

export function useNameEditorState() {
  const dispatch = useDispatch();

  const editingEntity = useSelector(getEditingEntityName);

  const updatingEntity = useSelector(getUpdatingEntity);

  const enterEditMode = useCallback(
    (id: string) => {
      dispatch(initExplorerEntityNameEdit(id));
    },
    [dispatch],
  );

  const exitEditMode = useCallback(() => {
    dispatch({
      type: ReduxActionTypes.END_EXPLORER_ENTITY_NAME_EDIT,
    });
  }, [dispatch]);

  return {
    enterEditMode,
    exitEditMode,
    editingEntity,
    updatingEntity,
  };
}
