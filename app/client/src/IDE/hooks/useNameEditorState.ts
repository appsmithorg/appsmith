import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  endExplorerEntityNameEdit,
  initExplorerEntityNameEdit,
} from "actions/explorerActions";
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
    dispatch(endExplorerEntityNameEdit());
  }, [dispatch]);

  return {
    enterEditMode,
    exitEditMode,
    editingEntity,
    updatingEntity,
  };
}
