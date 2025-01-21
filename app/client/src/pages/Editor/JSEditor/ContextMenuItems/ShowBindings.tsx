import React, { useCallback } from "react";
import { CONTEXT_SHOW_BINDING, createMessage } from "ee/constants/messages";
import { MenuItem } from "@appsmith/ads";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { JSCollection } from "entities/JSCollection";

interface Props {
  jsAction: JSCollection;
  disabled?: boolean;
}

export const ShowBindings = ({ disabled, jsAction }: Props) => {
  const dispatch = useDispatch();

  const handleSelect = useCallback(() => {
    dispatch({
      type: ReduxActionTypes.SET_ENTITY_INFO,
      payload: {
        entityId: jsAction.id,
        entityName: jsAction.name,
        entityType: ENTITY_TYPE.ACTION,
        show: true,
      },
    });
  }, [jsAction.id, jsAction.name]);

  return (
    <MenuItem disabled={disabled} onSelect={handleSelect}>
      {createMessage(CONTEXT_SHOW_BINDING)}
    </MenuItem>
  );
};
