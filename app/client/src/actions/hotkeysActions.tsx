import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const toggleHotKeysDialog = (isOpen?: boolean) => {
  return {
    type: ReduxActionTypes.TOGGLE_HOTKEYS_DIALOG,
    payload: isOpen,
  };
};

export const initHotkeys = (hotkeys: Record<string, string>) => {
  return {
    type: ReduxActionTypes.HOTKEYS_INIT,
    payload: hotkeys,
  };
};
