import React, { useCallback } from "react";
import { Button } from "@appsmith/ads";
import { setDebuggerStateInspectorSelectedItem } from "actions/debuggerStateInspector";
import { useDispatch } from "react-redux";
import { DEBUGGER_TAB_KEYS } from "../../constants";
import { useDebuggerConfig } from "../../hooks/useDebuggerConfig";
import { CONTEXT_INSPECT_STATE, createMessage } from "ee/constants/messages";

interface Props {
  entityId: string;
  disabled?: boolean;
}

export function InspectStateHeaderButton({ disabled, entityId }: Props) {
  const dispatch = useDispatch();
  const config = useDebuggerConfig();

  const handleSelect = useCallback(() => {
    dispatch(setDebuggerStateInspectorSelectedItem(entityId));
    dispatch(
      config.set({ open: true, selectedTab: DEBUGGER_TAB_KEYS.STATE_TAB }),
    );
  }, [config, dispatch, entityId]);

  return (
    <Button
      disabled={disabled}
      kind="tertiary"
      onClick={handleSelect}
      size="sm"
      startIcon="code"
    >
      {createMessage(CONTEXT_INSPECT_STATE)}
    </Button>
  );
}
