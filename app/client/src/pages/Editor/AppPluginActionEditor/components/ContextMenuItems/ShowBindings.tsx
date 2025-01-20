import React, { useCallback } from "react";
import { CONTEXT_SHOW_BINDING, createMessage } from "ee/constants/messages";
import { MenuItem } from "@appsmith/ads";
import type { Action } from "entities/Action";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";

interface Props {
  action: Action;
  disabled?: boolean;
}

export const ShowBindings = ({ action, disabled }: Props) => {
  const dispatch = useDispatch();

  const handleSelect = useCallback(() => {
    dispatch({
      type: ReduxActionTypes.SET_ENTITY_INFO,
      payload: {
        entityId: action.id,
        entityName: action.name,
        entityType: ENTITY_TYPE.ACTION,
        show: true,
      },
    });
  }, [action.id, action.name]);

  return (
    <MenuItem disabled={disabled} onSelect={handleSelect}>
      {createMessage(CONTEXT_SHOW_BINDING)}
    </MenuItem>
  );
};
