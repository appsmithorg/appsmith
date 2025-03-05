import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { CONTEXT_CLONE, createMessage } from "ee/constants/messages";
import { useDispatch } from "react-redux";
import { clonePageInit } from "actions/pageActions";

interface Props {
  pageId: string;
  disabled?: boolean;
}

export const Clone = ({ disabled, pageId }: Props) => {
  const dispatch = useDispatch();
  const clonePage = useCallback(() => {
    dispatch(clonePageInit(pageId));
  }, [dispatch, pageId]);

  return (
    <MenuItem disabled={disabled} onSelect={clonePage} startIcon="duplicate">
      {createMessage(CONTEXT_CLONE)}
    </MenuItem>
  );
};
