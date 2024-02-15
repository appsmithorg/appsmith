import {
  EditorState,
  SidebarBottomButtonTitles,
  type SidebarButton,
} from "@appsmith/entities/IDE/constants";
import { DEFAULT_TAB } from "./LeftPane/SettingsPane";

export const BottomButtons: SidebarButton[] = [
  {
    state: EditorState.SETTINGS,
    icon: "settings-v3",
    title: SidebarBottomButtonTitles.SETTINGS,
    urlSuffix: `settings/${DEFAULT_TAB}`,
  },
];
