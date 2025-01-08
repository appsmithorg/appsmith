import { EditorEntityTab, EditorViewMode } from "../../ee/entities/IDE/constants";

export interface IDEState {
  view: EditorViewMode;
  isListViewActive: boolean;
  tabs: ParentEntityIDETabs;
  showCreateModal: boolean;
  renameEntity: string;
  ideCanvasSideBySideHover: IDECanvasSideBySideHover;
}

export interface ParentEntityIDETabs {
  [parentId: string]: IDETabs;
}

export interface IDETabs {
  [EditorEntityTab.JS]: string[];
  [EditorEntityTab.QUERIES]: string[];
}

export interface IDECanvasSideBySideHover {
  navigated: boolean;
  widgetTypes: string[];
}
