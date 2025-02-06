import React, { useCallback } from "react";
import { Button } from "@appsmith/ads";
import { setDebuggerStateInspectorSelectedItem } from "actions/debuggerActions";
import { useDispatch } from "react-redux";
import { DEBUGGER_TAB_KEYS } from "../constants";
import { useDebuggerConfig } from "../hooks/useDebuggerConfig";

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
    <Button
      disabled={disabled}
      isIconButton
      kind="tertiary"
      onClick={handleSelect}
      startIcon="code"
    />
  );
}
