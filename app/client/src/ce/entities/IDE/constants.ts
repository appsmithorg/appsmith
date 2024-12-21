import {
  ADD_PATH,
  API_EDITOR_ID_ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  DATA_SOURCES_EDITOR_ID_PATH,
  ENTITY_PATH,
  INTEGRATION_EDITOR_PATH,
  JS_COLLECTION_ID_ADD_PATH,
  JS_COLLECTION_ID_PATH,
  QUERIES_EDITOR_ID_ADD_PATH,
  QUERIES_EDITOR_ID_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "ee/constants/routes/appRoutes";
import {
  SAAS_EDITOR_API_ID_ADD_PATH,
  SAAS_EDITOR_API_ID_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
} from "pages/Editor/SaaSEditor/constants";
import type { PluginType } from "entities/Action";
import type { ComponentType, ReactNode } from "react";
import type { IDESidebarButton } from "IDE";

export enum EditorState {
  DATA = "DATA",
  EDITOR = "EDITOR",
  SETTINGS = "SETTINGS",
  LIBRARIES = "LIBRARIES",
}

export const SidebarTopButtonTitles = {
  EDITOR: "Editor",
};

export const SidebarBottomButtonTitles = {
  DATA: "Datasources",
  SETTINGS: "Settings",
  LIBRARIES: "Libraries",
};

export enum EditorEntityTab {
  QUERIES = "queries",
  JS = "js",
  UI = "ui",
}

export enum EditorEntityTabState {
  List = "List",
  Edit = "Edit",
  Add = "Add",
}

export enum EditorViewMode {
  FullScreen = "FullScreen",
  SplitScreen = "SplitScreen",
}

export const TopButtons: IDESidebarButton[] = [
  {
    state: EditorState.EDITOR,
    icon: "editor-v3",
    title: SidebarTopButtonTitles.EDITOR,
    testId: SidebarTopButtonTitles.EDITOR,
    urlSuffix: "",
  },
];

export const BottomButtons: IDESidebarButton[] = [
  {
    state: EditorState.DATA,
    icon: "datasource-v3",
    tooltip: SidebarBottomButtonTitles.DATA,
    testId: SidebarBottomButtonTitles.DATA,
    urlSuffix: "datasource",
  },
  {
    state: EditorState.LIBRARIES,
    icon: "packages-v3",
    tooltip: SidebarBottomButtonTitles.LIBRARIES,
    testId: SidebarBottomButtonTitles.LIBRARIES,
    urlSuffix: "libraries",
  },
  {
    state: EditorState.SETTINGS,
    icon: "settings-v3",
    tooltip: SidebarBottomButtonTitles.SETTINGS,
    testId: SidebarBottomButtonTitles.SETTINGS,
    urlSuffix: "settings",
  },
];

export const IDE_TYPE = {
  None: "None",
  App: "App",
} as const;

export type IDEType = keyof typeof IDE_TYPE;

export const EntityPaths: string[] = [
  API_EDITOR_ID_ADD_PATH,
  API_EDITOR_ID_PATH,
  QUERIES_EDITOR_ID_ADD_PATH,
  QUERIES_EDITOR_ID_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  INTEGRATION_EDITOR_PATH,
  SAAS_EDITOR_DATASOURCE_ID_PATH,
  SAAS_EDITOR_API_ID_ADD_PATH,
  SAAS_EDITOR_API_ID_PATH,
  JS_COLLECTION_ID_PATH,
  JS_COLLECTION_ID_ADD_PATH,
  WIDGETS_EDITOR_ID_PATH,
  WIDGETS_EDITOR_ID_PATH + ADD_PATH,
  ENTITY_PATH,
];

export const IDEBasePaths: Readonly<Record<IDEType, string[]>> = {
  [IDE_TYPE.None]: [],
  [IDE_TYPE.App]: [BUILDER_PATH, BUILDER_PATH_DEPRECATED, BUILDER_CUSTOM_PATH],
};

export interface EntityItem {
  title: string;
  type: PluginType;
  key: string;
  icon?: ReactNode;
  group?: string;
  userPermissions?: string[];
}

export type UseRoutes = Array<{
  key: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  path: string[];
  exact: boolean;
}>;
