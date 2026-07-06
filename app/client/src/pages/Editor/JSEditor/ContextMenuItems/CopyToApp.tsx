import React, { useCallback } from "react";
import { CONTEXT_COPY_TO_APP, createMessage } from "ee/constants/messages";
import { MenuItem } from "@appsmith/ads";
import type { JSCollection } from "entities/JSCollection";
import { useDispatch } from "react-redux";
import { openCopyToAppModal } from "actions/copyToAppActions";
import { CopyToAppEntityType } from "pages/Editor/Explorer/CopyToApp/types";

interface Props {
  jsAction: JSCollection;
  disabled?: boolean;
}

export const CopyToApp = ({ disabled, jsAction }: Props) => {
  const dispatch = useDispatch();

  const handleSelect = useCallback(() => {
    dispatch(
      openCopyToAppModal({
        entityType: CopyToAppEntityType.JS_OBJECT,
        entityId: jsAction.id,
        entityName: jsAction.name,
        sourcePageId: jsAction.pageId,
      }),
    );
  }, [dispatch, jsAction.id, jsAction.name, jsAction.pageId]);

  return (
    <MenuItem disabled={disabled} onSelect={handleSelect} startIcon="duplicate">
      {createMessage(CONTEXT_COPY_TO_APP)}
    </MenuItem>
  );
};
