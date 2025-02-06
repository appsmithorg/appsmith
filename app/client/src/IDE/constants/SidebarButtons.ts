import type { IDESidebarButton } from "@appsmith/ads";
import { EditorState } from "IDE/Interfaces/EditorState";

const SidebarButtonTitles = {
  EDITOR: "Editor",
  DATA: "Datasources",
  SETTINGS: "Settings",
  LIBRARIES: "Libraries",
};

export const EditorButton = (urlSuffix: string): IDESidebarButton => ({
  state: EditorState.EDITOR,
  icon: "editor-v3",
  title: SidebarButtonTitles.EDITOR,
  testId: SidebarButtonTitles.EDITOR,
  urlSuffix,
});

export const DataButton = (urlSuffix: string): IDESidebarButton => ({
  state: EditorState.DATA,
  icon: "datasource-v3",
  tooltip: SidebarButtonTitles.DATA,
  testId: SidebarButtonTitles.DATA,
  urlSuffix,
});

export const LibrariesButton = (urlSuffix: string): IDESidebarButton => ({
  state: EditorState.LIBRARIES,
  icon: "packages-v3",
  tooltip: SidebarButtonTitles.LIBRARIES,
  testId: SidebarButtonTitles.LIBRARIES,
  urlSuffix,
});

export const SettingsButton = (urlSuffix: string): IDESidebarButton => ({
  state: EditorState.SETTINGS,
  icon: "settings-v3",
  tooltip: SidebarButtonTitles.SETTINGS,
  testId: SidebarButtonTitles.SETTINGS,
  urlSuffix,
});
