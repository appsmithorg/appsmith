import type { AppState } from "@appsmith/reducers";

export const getHotkeysDialogOpen = (state: AppState) =>
  state.ui.hotkeys.dialogOpen;

export const getHotkeyFromAction = (state: AppState, action: string) => {
  const hotkeys = state.ui.hotkeys.hotkeys;

  return hotkeys[action];
};
