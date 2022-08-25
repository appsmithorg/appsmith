import { getApiPaneSelectedTabIndex } from "selectors/apiPaneSelectors";
import { setApiPaneSelectedTabIndex } from "actions/apiPaneActions";
import { AppState } from "reducers";
import { ReduxAction } from "ce/constants/ReduxActionConstants";
import { getCodeEditorHistory } from "selectors/codeEditorSelectors";
import { codeEditorBlurred } from "actions/codeEditorActions";

export enum FocusEntity {
  API = "API",
  CANVAS = "CANVAS",
  QUERY = "QUERY",
  PROPERTY_PANE = "PROPERTY_PANE",
}

export enum FocusElement {
  ApiPaneTabs = "ApiPaneTabs",
  CodeEditor = "CodeEditor",
}

type Config = {
  name: FocusElement;
  selector: (state: AppState) => unknown;
  setter: (payload: any) => ReduxAction<any>;
  defaultValue?: unknown;
};

export const FocusElementsConfig: Record<FocusEntity, Config[]> = {
  [FocusEntity.CANVAS]: [],
  [FocusEntity.QUERY]: [],
  [FocusEntity.PROPERTY_PANE]: [],
  [FocusEntity.API]: [
    {
      name: FocusElement.CodeEditor,
      selector: getCodeEditorHistory,
      setter: codeEditorBlurred,
    },
    {
      name: FocusElement.ApiPaneTabs,
      selector: getApiPaneSelectedTabIndex,
      setter: setApiPaneSelectedTabIndex,
      defaultValue: 0,
    },
  ],
};
