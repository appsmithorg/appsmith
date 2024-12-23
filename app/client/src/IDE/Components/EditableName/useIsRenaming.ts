import { useDispatch, useSelector } from "react-redux";
import { getIsRenaming } from "selectors/ideSelectors";
import { useCallback, useEffect, useState } from "react";
import { setRenameEntity } from "actions/ideActions";

export const useIsRenaming = (id: string) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);

  const isEditingViaExternal = useSelector(getIsRenaming(id));

  const isNew =
    new URLSearchParams(window.location.search).get("editName") === "true";

  useEffect(
    function onExternalEditEvent() {
      if (isEditingViaExternal || isNew) {
        setIsEditing(true);
      }

      return () => {
        setIsEditing(false);
      };
    },
    [isEditingViaExternal, isNew],
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
