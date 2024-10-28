import { useDispatch, useSelector } from "react-redux";
import { getIsRenaming } from "selectors/ideSelectors";
import { useCallback, useEffect, useState } from "react";
import { setRenameEntity } from "actions/ideActions";

export const useIsRenaming = (id: string) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);

  const isEditingViaExternal = useSelector(getIsRenaming(id));

  useEffect(
    function onExternalEditEvent() {
      if (isEditingViaExternal) {
        setIsEditing(true);
      }

      return () => {
        setIsEditing(false);
      };
    },
    [isEditingViaExternal],
  );

  const enterEditMode = useCallback(() => {
    setIsEditing(true);
  }, []);

  const exitEditMode = useCallback(() => {
    dispatch(setRenameEntity(""));
    setIsEditing(false);
  }, [dispatch]);

  return { isEditing, enterEditMode, exitEditMode };
};
