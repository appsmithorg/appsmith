import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { CONTEXT_INSPECT_STATE, createMessage } from "ee/constants/messages";
import { setDebuggerStateInspectorSelectedItem } from "actions/debuggerActions";
import { useDispatch } from "react-redux";
import { DEBUGGER_TAB_KEYS } from "../../constants";
import { useDebuggerConfig } from "../../hooks/useDebuggerConfig";

interface Props {
  entityId: string;
  disabled?: boolean;
}

export function InspectStateMenuItem({ disabled, entityId }: Props) {
  const dispatch = useDispatch();
  const config = useDebuggerConfig();

  const handleSelect = useCallback(() => {
    dispatch(setDebuggerStateInspectorSelectedItem(entityId));
    dispatch(
      config.set({ open: true, selectedTab: DEBUGGER_TAB_KEYS.STATE_TAB }),
    );
  }, [config, dispatch, entityId]);

  return (
    <MenuItem disabled={disabled} onSelect={handleSelect} startIcon="code">
      {createMessage(CONTEXT_INSPECT_STATE)}
    </MenuItem>
  );
}
