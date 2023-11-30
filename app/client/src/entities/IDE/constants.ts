export enum AppState {
  DATA = "DATA",
  EDITOR = "EDITOR",
  SETTINGS = "SETTINGS",
  LIBRARIES = "LIBRARIES",
}

export interface SidebarButton {
  state: AppState;
  icon: string;
  title?: string;
  urlSuffix: string;
}

export const TopButtons: SidebarButton[] = [
  {
    state: AppState.EDITOR,
    icon: "file-copy-2-line",
    title: "Editor",
    urlSuffix: "",
  },
  {
    state: AppState.DATA,
    icon: "database-2-line",
    title: "Data",
    urlSuffix: "datasource",
  },
];

export const ButtonButtons: SidebarButton[] = [
  {
    state: AppState.LIBRARIES,
    icon: "box-3-line",
    title: "Libraries",
    urlSuffix: "libraries",
  },
  {
    state: AppState.SETTINGS,
    icon: "settings-2-line",
    title: "Settings",
    urlSuffix: "settings",
  },
];
