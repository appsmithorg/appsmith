export enum EditorState {
  DATA = "DATA",
  EDITOR = "EDITOR",
  SETTINGS = "SETTINGS",
  LIBRARIES = "LIBRARIES",
}

export const SidebarTopButtonTitles = {
  DATA: "Data",
  EDITOR: "Editor",
};

export const SidebarBottomButtonTitles = {
  SETTINGS: "Settings",
  LIBRARIES: "Libraries",
};

export enum EditorEntityTab {
  QUERIES = "queries",
  JS = "js",
  UI = "ui",
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
    title: SidebarTopButtonTitles.EDITOR,
    urlSuffix: "",
  },
  {
    state: EditorState.DATA,
    icon: "database-2-line",
    title: SidebarTopButtonTitles.DATA,
    urlSuffix: "datasource",
  },
];

export const BottomButtons: SidebarButton[] = [
  {
    state: EditorState.LIBRARIES,
    icon: "box-3-line",
    title: SidebarBottomButtonTitles.LIBRARIES,
    urlSuffix: "libraries",
  },
  {
    state: EditorState.SETTINGS,
    icon: "settings-2-line",
    title: SidebarBottomButtonTitles.SETTINGS,
    urlSuffix: "settings",
  },
];
