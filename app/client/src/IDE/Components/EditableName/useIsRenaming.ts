import { useDispatch, useSelector } from "react-redux";
import { getIsRenaming } from "selectors/ideSelectors";
import { useCallback, useEffect, useState } from "react";
import { setRenameEntity } from "actions/ideActions";

export const useIsRenaming = (id: string) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [forcedEdit, setForcedEdit] = useState(false);

  const isEditingViaExternal = useSelector(getIsRenaming(id));

  useEffect(
    function onExternalEditEvent() {
      if (isEditingViaExternal) {
        setIsEditing(true);
        setForcedEdit(true);
      }
    },
    [isEditingViaExternal],
  );

  const enterEditMode = useCallback(() => {
    setIsEditing(true);
    setForcedEdit(false);
  }, []);

  const exitEditMode = useCallback(() => {
    dispatch(setRenameEntity(""));
    setIsEditing(false);
    setForcedEdit(false);
  }, [id]);

  return { isEditing, forcedEdit, enterEditMode, exitEditMode };
};
