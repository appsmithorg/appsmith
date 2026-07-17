import React, { useCallback } from "react";
import { CONTEXT_COPY_TO_APP, createMessage } from "ee/constants/messages";
import { MenuItem } from "@appsmith/ads";
import type { Action } from "entities/Action";
import { useDispatch } from "react-redux";
import { openCopyToAppModal } from "actions/copyToAppActions";
import { CopyToAppEntityType } from "pages/Editor/Explorer/CopyToApp/types";

interface Props {
  action: Action;
  disabled?: boolean;
}

export const CopyToApp = ({ action, disabled }: Props) => {
  const dispatch = useDispatch();

  const handleSelect = useCallback(() => {
    dispatch(
      openCopyToAppModal({
        entityType: CopyToAppEntityType.ACTION,
        entityId: action.id,
        entityName: action.name,
        sourcePageId: action.pageId,
      }),
    );
  }, [dispatch, action.id, action.name, action.pageId]);

  return (
    <MenuItem disabled={disabled} onSelect={handleSelect} startIcon="duplicate">
      {createMessage(CONTEXT_COPY_TO_APP)}
    </MenuItem>
  );
};
