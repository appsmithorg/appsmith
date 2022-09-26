import {
  getApiPaneConfigSelectedTabIndex,
  getApiPaneResponsePaneHeight,
  getApiPaneResponseSelectedTab,
} from "selectors/apiPaneSelectors";
import {
  setApiPaneResponseSelectedTab,
  setApiPaneConfigSelectedTabIndex,
  setApiPaneResponsePaneHeight,
} from "actions/apiPaneActions";
import { AppState } from "@appsmith/reducers";
import { ReduxAction } from "ce/constants/ReduxActionConstants";
import {
  getAllPropertySectionState,
  getCodeEditorHistory,
  getFocusableField,
  getPropertyPanelState,
  getSelectedCanvasDebuggerTab,
  getSelectedPropertyPanel,
  getWidgetSelectedPropertyTabIndex,
} from "selectors/editorContextSelectors";
import {
  setAllPropertySectionState,
  setCanvasDebuggerSelectedTab,
  setCodeEditorHistory,
  setFocusableField,
  setPanelPropertiesState,
  setSelectedPropertyPanel,
  setWidgetFocusableField,
  setWidgetSelectedPropertyTabIndex,
} from "actions/editorContextActions";
import { getSelectedWidgets } from "selectors/ui";
import { selectMultipleWidgetsInitAction } from "actions/widgetSelectionActions";

import { FocusEntity } from "navigation/FocusEntity";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import {
  getQueryPaneConfigSelectedTabIndex,
  getQueryPaneResponsePaneHeight,
  getQueryPaneResponseSelectedTab,
} from "selectors/queryPaneSelectors";
import {
  setQueryPaneConfigSelectedTabIndex,
  setQueryPaneResponsePaneHeight,
  setQueryPaneResponseSelectedTab,
} from "actions/queryPaneActions";
import {
  getJSPaneConfigSelectedTabIndex,
  getJSPaneResponsePaneHeight,
  getJSPaneResponseSelectedTab,
} from "selectors/jsPaneSelectors";
import {
  setJsPaneConfigSelectedTabIndex,
  setJsPaneResponsePaneHeight,
  setJsPaneResponseSelectedTab,
} from "actions/jsPaneActions";
import { getExplorerWidth } from "selectors/explorerSelector";
import { updateExplorerWidthAction } from "actions/explorerActions";
import {
  DEFAULT_ENTITY_EXPLORER_WIDTH,
  DEFAULT_PROPERTY_PANE_WIDTH,
} from "constants/AppConstants";
import { getPropertyPaneWidth } from "selectors/propertyPaneSelectors";
import { setPropertyPaneWidthAction } from "actions/propertyPaneActions";
import { setAllMetaProps } from "actions/metaActions";
import { getWidgetsMeta } from "sagas/selectors";
import { initialState as MetaDefaultState } from "reducers/entityReducers/metaReducer";

export enum FocusElement {
  ApiPaneConfigTabs = "ApiPaneConfigTabs",
  ApiPaneResponseTabs = "ApiPaneResponseTabs",
  ApiPaneResponseHeight = "ApiPaneResponseHeight",
  CanvasDebuggerTabs = "CanvasDebuggerTabs",
  CodeEditorHistory = "CodeEditorHistory",
  EntityExplorerWidth = "EntityExplorerWidth",
  QueryPaneConfigTabs = "QueryPaneConfigTabs",
  QueryPaneResponseTabs = "QueryPaneResponseTabs",
  QueryPaneResponseHeight = "QueryPaneResponseHeight",
  JSPaneConfigTabs = "JSPaneConfigTabs",
  JSPaneResponseTabs = "JSPaneResponseTabs",
  JSPaneResponseHeight = "JSPaneResponseHeight",
  PropertyField = "PropertyField",
  PropertySections = "PropertySections",
  PropertyTabs = "PropertyTabs",
  PropertyPanelContext = "PropertyPanelContext",
  SelectedPropertyPanel = "SelectedPropertyPanel",
  PropertyPaneWidth = "PropertyPaneWidth",
  SelectedWidgets = "SelectedWidgets",
  WidgetMeta = "WidgetMeta",
}

type Config = {
  name: FocusElement;
  selector: (state: AppState) => unknown;
  setter: (payload: any) => ReduxAction<any>;
  defaultValue?: unknown;
};

export const FocusElementsConfig: Record<FocusEntity, Config[]> = {
  [FocusEntity.NONE]: [],
  [FocusEntity.PAGE]: [
    {
      name: FocusElement.CodeEditorHistory,
      selector: getCodeEditorHistory,
      setter: setCodeEditorHistory,
      defaultValue: {},
    },
    {
      name: FocusElement.EntityExplorerWidth,
      selector: getExplorerWidth,
      setter: updateExplorerWidthAction,
      defaultValue: DEFAULT_ENTITY_EXPLORER_WIDTH,
    },
    {
      name: FocusElement.WidgetMeta,
      selector: getWidgetsMeta,
      setter: setAllMetaProps,
      defaultValue: MetaDefaultState,
    },
  ],
  [FocusEntity.CANVAS]: [
    {
      name: FocusElement.PropertySections,
      selector: getAllPropertySectionState,
      setter: setAllPropertySectionState,
      defaultValue: {},
    },
    {
      name: FocusElement.SelectedWidgets,
      selector: getSelectedWidgets,
      setter: selectMultipleWidgetsInitAction,
      defaultValue: [],
    },
    {
      name: FocusElement.CanvasDebuggerTabs,
      selector: getSelectedCanvasDebuggerTab,
      setter: setCanvasDebuggerSelectedTab,
    },
    {
      name: FocusElement.PropertyPaneWidth,
      selector: getPropertyPaneWidth,
      setter: setPropertyPaneWidthAction,
      defaultValue: DEFAULT_PROPERTY_PANE_WIDTH,
    },
  ],
  [FocusEntity.JS_OBJECT]: [
    {
      name: FocusElement.PropertyField,
      selector: getFocusableField,
      setter: setFocusableField,
    },
    {
      name: FocusElement.JSPaneConfigTabs,
      selector: getJSPaneConfigSelectedTabIndex,
      setter: setJsPaneConfigSelectedTabIndex,
      defaultValue: 0,
    },
    {
      name: FocusElement.JSPaneResponseTabs,
      selector: getJSPaneResponseSelectedTab,
      setter: setJsPaneResponseSelectedTab,
    },
    {
      name: FocusElement.JSPaneResponseHeight,
      selector: getJSPaneResponsePaneHeight,
      setter: setJsPaneResponsePaneHeight,
      defaultValue: ActionExecutionResizerHeight,
    },
  ],
  [FocusEntity.QUERY]: [
    {
      name: FocusElement.PropertyField,
      selector: getFocusableField,
      setter: setFocusableField,
    },
    {
      name: FocusElement.QueryPaneConfigTabs,
      selector: getQueryPaneConfigSelectedTabIndex,
      setter: setQueryPaneConfigSelectedTabIndex,
      defaultValue: 0,
    },
    {
      name: FocusElement.QueryPaneResponseTabs,
      selector: getQueryPaneResponseSelectedTab,
      setter: setQueryPaneResponseSelectedTab,
      defaultValue: 0,
    },
    {
      name: FocusElement.QueryPaneResponseHeight,
      selector: getQueryPaneResponsePaneHeight,
      setter: setQueryPaneResponsePaneHeight,
      defaultValue: ActionExecutionResizerHeight,
    },
  ],
  [FocusEntity.PROPERTY_PANE]: [
    {
      name: FocusElement.SelectedPropertyPanel,
      selector: getSelectedPropertyPanel,
      setter: setSelectedPropertyPanel,
      defaultValue: undefined,
    },
    {
      name: FocusElement.PropertyPanelContext,
      selector: getPropertyPanelState,
      setter: setPanelPropertiesState,
      defaultValue: {},
    },
    {
      name: FocusElement.PropertyTabs,
      selector: getWidgetSelectedPropertyTabIndex,
      setter: setWidgetSelectedPropertyTabIndex,
      defaultValue: 0,
    },
    {
      name: FocusElement.PropertyField,
      selector: getFocusableField,
      setter: setWidgetFocusableField,
    },
  ],
  [FocusEntity.API]: [
    {
      name: FocusElement.PropertyField,
      selector: getFocusableField,
      setter: setFocusableField,
    },
    {
      name: FocusElement.ApiPaneConfigTabs,
      selector: getApiPaneConfigSelectedTabIndex,
      setter: setApiPaneConfigSelectedTabIndex,
      defaultValue: 0,
    },
    {
      name: FocusElement.ApiPaneResponseTabs,
      selector: getApiPaneResponseSelectedTab,
      setter: setApiPaneResponseSelectedTab,
    },
    {
      name: FocusElement.ApiPaneResponseHeight,
      selector: getApiPaneResponsePaneHeight,
      setter: setApiPaneResponsePaneHeight,
      defaultValue: ActionExecutionResizerHeight,
    },
  ],
};
