import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { CONTEXT_SET_AS_HOME_PAGE, createMessage } from "ee/constants/messages";
import { useDispatch } from "react-redux";
import { setPageAsDefault } from "actions/pageActions";

interface Props {
  pageId: string;
  applicationId: string;
  disabled?: boolean;
}

export const SetAsHomePage = ({ applicationId, disabled, pageId }: Props) => {
  const dispatch = useDispatch();
  const setPageAsDefaultCallback = useCallback(() => {
    dispatch(setPageAsDefault(pageId, applicationId));
  }, [dispatch, pageId, applicationId]);

  return (
    <MenuItem
      disabled={disabled}
      onSelect={setPageAsDefaultCallback}
      startIcon="home-3-line"
    >
      {createMessage(CONTEXT_SET_AS_HOME_PAGE)}
    </MenuItem>
  );
};
