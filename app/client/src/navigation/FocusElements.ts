import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "@appsmith/reducers";
import {
  setApiPaneConfigSelectedTabIndex,
  setApiRightPaneSelectedTab,
} from "actions/apiPaneActions";
import {
  setAllEntityCollapsibleStates,
  setAllSubEntityCollapsibleStates,
  setCodeEditorHistory,
  setExplorerSwitchIndex,
  setFocusableInputField,
  setPanelPropertiesState,
  setWidgetSelectedPropertyTabIndex,
} from "actions/editorContextActions";
import {
  getApiPaneConfigSelectedTabIndex,
  getApiRightPaneSelectedTab,
} from "selectors/apiPaneSelectors";
import {
  getAllEntityCollapsibleStates,
  getAllPropertySectionState,
  getAllSubEntityCollapsibleStates,
  getCodeEditorHistory,
  getExplorerSwitchIndex,
  getFocusableInputField,
  getPropertyPanelState,
  getWidgetSelectedPropertyTabIndex,
} from "selectors/editorContextSelectors";
import {
  getAllDatasourceCollapsibleState,
  getDsViewModeValues,
  getSelectedWidgets,
} from "selectors/ui";

import {
  setAllDatasourceCollapsible,
  setDatasourceViewMode,
} from "actions/datasourceActions";
import { updateExplorerWidthAction } from "actions/explorerActions";
import { setJsPaneConfigSelectedTab } from "actions/jsPaneActions";
import {
  setAllPropertySectionState,
  setFocusablePropertyPaneField,
  setPropertyPaneWidthAction,
  setSelectedPropertyPanels,
} from "actions/propertyPaneActions";
import { setQueryPaneConfigSelectedTabIndex } from "actions/queryPaneActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import {
  DEFAULT_ENTITY_EXPLORER_WIDTH,
  DEFAULT_PROPERTY_PANE_WIDTH,
} from "constants/AppConstants";
import { PluginPackageName } from "entities/Action";
import { FocusEntity } from "navigation/FocusEntity";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getExplorerWidth } from "selectors/explorerSelector";
import {
  getFirstJSObjectId,
  getJSPaneConfigSelectedTab,
} from "selectors/jsPaneSelectors";
import {
  getFocusablePropertyPaneField,
  getPropertyPaneWidth,
  getSelectedPropertyPanel,
} from "selectors/propertyPaneSelectors";
import {
  getFirstQueryId,
  getQueryPaneConfigSelectedTabIndex,
} from "selectors/queryPaneSelectors";
import { getDebuggerContext } from "selectors/debuggerSelectors";
import { setDebuggerContext } from "actions/debuggerActions";
import { DefaultDebuggerContext } from "reducers/uiReducers/debuggerReducer";
import { NavigationMethod } from "../utils/history";
import { JSEditorTab } from "../reducers/uiReducers/jsPaneReducer";
import {
  getCurrentAppUrl,
  getCurrentPageUrl,
  getSelectedDatasourceId,
  getSelectedJSObjectId,
  getSelectedQueryId,
} from "./FocusSelectors";
import {
  setSelectedDatasource,
  setSelectedJSObject,
  setPageUrl,
  setAppUrl,
  setSelectedQuery,
} from "./FocusSetters";
import { getFirstDatasourceId } from "../selectors/datasourceSelectors";

export enum FocusElement {
  ApiPaneConfigTabs = "ApiPaneConfigTabs",
  CodeEditorHistory = "CodeEditorHistory",
  EntityCollapsibleState = "EntityCollapsibleState",
  EntityExplorerWidth = "EntityExplorerWidth",
  ExplorerSwitchIndex = "ExplorerSwitchIndex",
  DatasourceViewMode = "DatasourceViewMode",
  DatasourceAccordions = "DatasourceAccordions",
  SelectedDatasource = "SelectedDatasource",
  DebuggerContext = "DebuggerContext",
  ApiRightPaneTabs = "ApiRightPaneTabs",
  QueryPaneConfigTabs = "QueryPaneConfigTabs",
  JSPaneConfigTabs = "JSPaneConfigTabs",
  PropertySections = "PropertySections",
  PropertyField = "PropertyField",
  PropertyTabs = "PropertyTabs",
  PropertyPanelContext = "PropertyPanelContext",
  PropertyPaneWidth = "PropertyPaneWidth",
  SelectedPropertyPanel = "SelectedPropertyPanel",
  SelectedWidgets = "SelectedWidgets",
  SubEntityCollapsibleState = "SubEntityCollapsibleState",
  InputField = "InputField",
  PageUrl = "PageUrl",
  AppUrl = "AppUrl",
  SelectedQuery = "SelectedQuery",
  SelectedJSObject = "SelectedJSObject",
}

export enum ConfigType {
  Redux = "Redux",
  URL = "URL",
}

interface ConfigOther {
  name: FocusElement;
  /* If a selector is added for default value, it will be supplied the state to
  derive a default value */
  defaultValue?: unknown | ((state: AppState) => unknown);
  subTypes?: Record<string, { defaultValue: unknown }>;
}

type ConfigRedux = {
  type: ConfigType.Redux;
  selector: (state: AppState) => unknown;
  setter: (payload: any) => ReduxAction<any>;
} & ConfigOther;

type ConfigURL = {
  type: ConfigType.URL;
  selector: (url: string) => unknown;
  setter: (payload: any) => void;
} & ConfigOther;

export type Config = ConfigRedux | ConfigURL;

export const FocusElementsConfig: Record<FocusEntity, Config[]> = {
  [FocusEntity.NONE]: [],
  [FocusEntity.APP_STATE]: [
    {
      type: ConfigType.URL,
      name: FocusElement.AppUrl,
      selector: getCurrentAppUrl,
      setter: setAppUrl,
    },
  ],
  [FocusEntity.PAGE]: [
    {
      type: ConfigType.URL,
      name: FocusElement.PageUrl,
      selector: getCurrentPageUrl,
      setter: setPageUrl,
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.EntityExplorerWidth,
      selector: getExplorerWidth,
      setter: updateExplorerWidthAction,
      defaultValue: DEFAULT_ENTITY_EXPLORER_WIDTH,
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.EntityCollapsibleState,
      selector: getAllEntityCollapsibleStates,
      setter: setAllEntityCollapsibleStates,
      defaultValue: {},
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.SubEntityCollapsibleState,
      selector: getAllSubEntityCollapsibleStates,
      setter: setAllSubEntityCollapsibleStates,
      defaultValue: {},
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.ExplorerSwitchIndex,
      selector: getExplorerSwitchIndex,
      setter: setExplorerSwitchIndex,
      defaultValue: 0,
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.PropertyPanelContext,
      selector: getPropertyPanelState,
      setter: setPanelPropertiesState,
      defaultValue: {},
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.CodeEditorHistory,
      selector: getCodeEditorHistory,
      setter: setCodeEditorHistory,
      defaultValue: {},
    },
  ],
  [FocusEntity.CANVAS]: [
    {
      type: ConfigType.Redux,
      name: FocusElement.PropertySections,
      selector: getAllPropertySectionState,
      setter: setAllPropertySectionState,
      defaultValue: {},
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.SelectedPropertyPanel,
      selector: getSelectedPropertyPanel,
      setter: setSelectedPropertyPanels,
      defaultValue: {},
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.SelectedWidgets,
      selector: getSelectedWidgets,
      setter: (widgetIds: string[]) =>
        selectWidgetInitAction(
          SelectionRequestType.Multiple,
          widgetIds,
          NavigationMethod.ContextSwitching,
        ),
      defaultValue: [],
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.PropertyPaneWidth,
      selector: getPropertyPaneWidth,
      setter: setPropertyPaneWidthAction,
      defaultValue: DEFAULT_PROPERTY_PANE_WIDTH,
    },
  ],
  [FocusEntity.DATASOURCE_LIST]: [
    {
      type: ConfigType.URL,
      name: FocusElement.SelectedDatasource,
      selector: getSelectedDatasourceId,
      setter: setSelectedDatasource,
      defaultValue: getFirstDatasourceId,
    },
  ],
  [FocusEntity.DATASOURCE]: [
    {
      type: ConfigType.Redux,
      name: FocusElement.DatasourceViewMode,
      selector: getDsViewModeValues,
      setter: setDatasourceViewMode,
      defaultValue: { datasourceId: "", viewMode: true },
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.DatasourceAccordions,
      selector: getAllDatasourceCollapsibleState,
      setter: setAllDatasourceCollapsible,
    },
  ],
  [FocusEntity.JS_OBJECT]: [
    {
      type: ConfigType.Redux,
      name: FocusElement.InputField,
      selector: getFocusableInputField,
      setter: setFocusableInputField,
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.JSPaneConfigTabs,
      selector: getJSPaneConfigSelectedTab,
      setter: setJsPaneConfigSelectedTab,
      defaultValue: JSEditorTab.CODE,
    },
  ],
  [FocusEntity.QUERY]: [
    {
      type: ConfigType.Redux,
      name: FocusElement.InputField,
      selector: getFocusableInputField,
      setter: setFocusableInputField,
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.QueryPaneConfigTabs,
      selector: getQueryPaneConfigSelectedTabIndex,
      setter: setQueryPaneConfigSelectedTabIndex,
      defaultValue: 0,
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.ApiPaneConfigTabs,
      selector: getApiPaneConfigSelectedTabIndex,
      setter: setApiPaneConfigSelectedTabIndex,
      defaultValue: 0,
      subTypes: {
        [PluginPackageName.GRAPHQL]: {
          defaultValue: 2,
        },
      },
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.InputField,
      selector: getFocusableInputField,
      setter: setFocusableInputField,
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.ApiRightPaneTabs,
      selector: getApiRightPaneSelectedTab,
      setter: setApiRightPaneSelectedTab,
    },
  ],
  [FocusEntity.PROPERTY_PANE]: [
    {
      type: ConfigType.Redux,
      name: FocusElement.PropertyTabs,
      selector: getWidgetSelectedPropertyTabIndex,
      setter: setWidgetSelectedPropertyTabIndex,
      defaultValue: 0,
    },
    {
      type: ConfigType.Redux,
      name: FocusElement.PropertyField,
      selector: getFocusablePropertyPaneField,
      setter: setFocusablePropertyPaneField,
      defaultValue: "",
    },
  ],
  [FocusEntity.API]: [],
  [FocusEntity.DEBUGGER]: [
    {
      type: ConfigType.Redux,
      name: FocusElement.DebuggerContext,
      selector: getDebuggerContext,
      setter: setDebuggerContext,
      defaultValue: DefaultDebuggerContext,
    },
  ],
  [FocusEntity.LIBRARY]: [],
  [FocusEntity.SETTINGS]: [],
  [FocusEntity.QUERY_LIST]: [
    {
      type: ConfigType.URL,
      name: FocusElement.SelectedQuery,
      selector: getSelectedQueryId,
      setter: setSelectedQuery,
      defaultValue: getFirstQueryId,
    },
  ],
  [FocusEntity.JS_OBJECT_LIST]: [
    {
      type: ConfigType.URL,
      name: FocusElement.SelectedJSObject,
      selector: getSelectedJSObjectId,
      setter: setSelectedJSObject,
      defaultValue: getFirstJSObjectId,
    },
  ],
};
