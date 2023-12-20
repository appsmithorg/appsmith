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
    icon: "editor-v3",
    title: SidebarTopButtonTitles.EDITOR,
    urlSuffix: "",
  },
  {
    state: EditorState.DATA,
    icon: "datasource-v3",
    title: SidebarTopButtonTitles.DATA,
    urlSuffix: "datasource",
  },
];

export const BottomButtons: SidebarButton[] = [
  {
    state: EditorState.LIBRARIES,
    icon: "packages-v3",
    title: SidebarBottomButtonTitles.LIBRARIES,
    urlSuffix: "libraries",
  },
  {
    state: EditorState.SETTINGS,
    icon: "settings-v3",
    title: SidebarBottomButtonTitles.SETTINGS,
    urlSuffix: "settings",
  },
];
