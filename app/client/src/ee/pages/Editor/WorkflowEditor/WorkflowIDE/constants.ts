import { EditorState, type SidebarButton } from "entities/IDE/constants";

export const BottomButtons: SidebarButton[] = [
  {
    state: EditorState.SETTINGS,
    icon: "settings-2-line",
    title: "Settings",
    urlSuffix: "settings",
  },
];
