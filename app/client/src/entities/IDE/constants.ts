export enum EditorState {
  DATA = "DATA",
  EDITOR = "EDITOR",
  SETTINGS = "SETTINGS",
  LIBRARIES = "LIBRARIES",
}

export interface SidebarButton {
  state: EditorState;
  icon: string;
  title?: string;
  urlSuffix: string;
}

export const TopButtons: SidebarButton[] = [
  {
    state: EditorState.EDITOR,
    icon: "file-copy-2-line",
    title: "Editor",
    urlSuffix: "",
  },
  {
    state: EditorState.DATA,
    icon: "database-2-line",
    title: "Data",
    urlSuffix: "datasource",
  },
];

export const BottomButtons: SidebarButton[] = [
  {
    state: EditorState.LIBRARIES,
    icon: "box-3-line",
    title: "Libraries",
    urlSuffix: "libraries",
  },
  {
    state: EditorState.SETTINGS,
    icon: "settings-2-line",
    title: "Settings",
    urlSuffix: "settings",
  },
];
