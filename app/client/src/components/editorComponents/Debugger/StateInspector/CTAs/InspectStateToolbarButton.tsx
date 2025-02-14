import React, { useCallback } from "react";
import { Button, Tooltip } from "@appsmith/ads";
import { setDebuggerStateInspectorSelectedItem } from "actions/debuggerStateInspector";
import { useDispatch } from "react-redux";
import { DEBUGGER_TAB_KEYS } from "../../constants";
import { useDebuggerConfig } from "../../hooks/useDebuggerConfig";
import { CONTEXT_INSPECT_STATE, createMessage } from "ee/constants/messages";

interface Props {
  entityId: string;
  disabled?: boolean;
}

export function InspectStateToolbarButton({ disabled, entityId }: Props) {
  const dispatch = useDispatch();
  const config = useDebuggerConfig();

  const handleSelect = useCallback(() => {
    dispatch(setDebuggerStateInspectorSelectedItem(entityId));
    dispatch(
      config.set({ open: true, selectedTab: DEBUGGER_TAB_KEYS.STATE_TAB }),
    );
  }, [config, dispatch, entityId]);

  return (
    <Tooltip content={createMessage(CONTEXT_INSPECT_STATE)}>
      <Button
        disabled={disabled}
        isIconButton
        kind="tertiary"
        onClick={handleSelect}
        startIcon="code"
      />
    </Tooltip>
  );
}
