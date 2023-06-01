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
  setCodeTabPath,
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
  getSelectedWidgets,
  isDatasourceInViewMode,
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
import { getJSPaneConfigSelectedTab } from "selectors/jsPaneSelectors";
import {
  getFocusablePropertyPaneField,
  getPropertyPaneWidth,
  getSelectedPropertyPanel,
} from "selectors/propertyPaneSelectors";
import { getQueryPaneConfigSelectedTabIndex } from "selectors/queryPaneSelectors";
import { getDebuggerContext } from "selectors/debuggerSelectors";
import { setDebuggerContext } from "actions/debuggerActions";
import { DefaultDebuggerContext } from "reducers/uiReducers/debuggerReducer";
import { NavigationMethod } from "../utils/history";
import { JSEditorTab } from "../reducers/uiReducers/jsPaneReducer";
import { getCodeTabPath } from "selectors/canvasCodeSelectors";

export enum FocusElement {
  ApiPaneConfigTabs = "ApiPaneConfigTabs",
  CodeTabPath = "CodeTabPath",
  CodeEditorHistory = "CodeEditorHistory",
  EntityCollapsibleState = "EntityCollapsibleState",
  EntityExplorerWidth = "EntityExplorerWidth",
  ExplorerSwitchIndex = "ExplorerSwitchIndex",
  DatasourceViewMode = "DatasourceViewMode",
  DatasourceAccordions = "DatasourceAccordions",
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
}

type Config = {
  name: FocusElement;
  selector: (state: AppState) => unknown;
  setter: (payload: any) => ReduxAction<any>;
  defaultValue?: unknown;
  subTypes?: Record<string, { defaultValue: unknown }>;
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
      name: FocusElement.EntityCollapsibleState,
      selector: getAllEntityCollapsibleStates,
      setter: setAllEntityCollapsibleStates,
      defaultValue: {},
    },
    {
      name: FocusElement.SubEntityCollapsibleState,
      selector: getAllSubEntityCollapsibleStates,
      setter: setAllSubEntityCollapsibleStates,
      defaultValue: {},
    },
    {
      name: FocusElement.ExplorerSwitchIndex,
      selector: getExplorerSwitchIndex,
      setter: setExplorerSwitchIndex,
      defaultValue: 0,
    },
    {
      name: FocusElement.PropertyPanelContext,
      selector: getPropertyPanelState,
      setter: setPanelPropertiesState,
      defaultValue: {},
    },
    {
      name: FocusElement.CodeTabPath,
      selector: getCodeTabPath,
      setter: setCodeTabPath,
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
      name: FocusElement.SelectedPropertyPanel,
      selector: getSelectedPropertyPanel,
      setter: setSelectedPropertyPanels,
      defaultValue: {},
    },
    {
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
      name: FocusElement.PropertyPaneWidth,
      selector: getPropertyPaneWidth,
      setter: setPropertyPaneWidthAction,
      defaultValue: DEFAULT_PROPERTY_PANE_WIDTH,
    },
  ],
  [FocusEntity.DATASOURCE]: [
    {
      name: FocusElement.DatasourceViewMode,
      selector: isDatasourceInViewMode,
      setter: setDatasourceViewMode,
      defaultValue: true,
    },
    {
      name: FocusElement.DatasourceAccordions,
      selector: getAllDatasourceCollapsibleState,
      setter: setAllDatasourceCollapsible,
    },
  ],
  [FocusEntity.JS_OBJECT]: [
    {
      name: FocusElement.InputField,
      selector: getFocusableInputField,
      setter: setFocusableInputField,
    },
    {
      name: FocusElement.JSPaneConfigTabs,
      selector: getJSPaneConfigSelectedTab,
      setter: setJsPaneConfigSelectedTab,
      defaultValue: JSEditorTab.CODE,
    },
  ],
  [FocusEntity.QUERY]: [
    {
      name: FocusElement.InputField,
      selector: getFocusableInputField,
      setter: setFocusableInputField,
    },
    {
      name: FocusElement.QueryPaneConfigTabs,
      selector: getQueryPaneConfigSelectedTabIndex,
      setter: setQueryPaneConfigSelectedTabIndex,
      defaultValue: 0,
    },
  ],
  [FocusEntity.PROPERTY_PANE]: [
    {
      name: FocusElement.PropertyTabs,
      selector: getWidgetSelectedPropertyTabIndex,
      setter: setWidgetSelectedPropertyTabIndex,
      defaultValue: 0,
    },
    {
      name: FocusElement.PropertyField,
      selector: getFocusablePropertyPaneField,
      setter: setFocusablePropertyPaneField,
      defaultValue: "",
    },
  ],
  [FocusEntity.API]: [
    {
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
      name: FocusElement.InputField,
      selector: getFocusableInputField,
      setter: setFocusableInputField,
    },
    {
      name: FocusElement.ApiRightPaneTabs,
      selector: getApiRightPaneSelectedTab,
      setter: setApiRightPaneSelectedTab,
    },
  ],
  [FocusEntity.DEBUGGER]: [
    {
      name: FocusElement.DebuggerContext,
      selector: getDebuggerContext,
      setter: setDebuggerContext,
      defaultValue: DefaultDebuggerContext,
    },
  ],
};
