import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "@appsmith/reducers";
import {
  setApiPaneConfigSelectedTabIndex,
  setApiPaneResponsePaneHeight,
  setApiPaneResponseSelectedTab,
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
  getApiPaneResponsePaneHeight,
  getApiPaneResponseSelectedTab,
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
  getSelectedCanvasDebuggerTab,
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
import { setCanvasDebuggerSelectedTab } from "actions/debuggerActions";
import { updateExplorerWidthAction } from "actions/explorerActions";
import {
  setJsPaneConfigSelectedTabIndex,
  setJsPaneResponsePaneHeight,
  setJsPaneResponseSelectedTab,
} from "actions/jsPaneActions";
import {
  setAllPropertySectionState,
  setFocusablePropertyPaneField,
  setPropertyPaneWidthAction,
  setSelectedPropertyPanels,
} from "actions/propertyPaneActions";
import {
  setQueryPaneConfigSelectedTabIndex,
  setQueryPaneResponsePaneHeight,
  setQueryPaneResponseSelectedTab,
} from "actions/queryPaneActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import {
  DEFAULT_ENTITY_EXPLORER_WIDTH,
  DEFAULT_PROPERTY_PANE_WIDTH,
} from "constants/AppConstants";
import { PluginPackageName } from "entities/Action";
import { FocusEntity } from "navigation/FocusEntity";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getExplorerWidth } from "selectors/explorerSelector";
import {
  getJSPaneConfigSelectedTabIndex,
  getJSPaneResponsePaneHeight,
  getJSPaneResponseSelectedTab,
} from "selectors/jsPaneSelectors";
import {
  getFocusablePropertyPaneField,
  getPropertyPaneWidth,
  getSelectedPropertyPanel,
} from "selectors/propertyPaneSelectors";
import {
  getQueryPaneConfigSelectedTabIndex,
  getQueryPaneResponsePaneHeight,
  getQueryPaneResponseSelectedTab,
} from "selectors/queryPaneSelectors";

export enum FocusElement {
  ApiPaneConfigTabs = "ApiPaneConfigTabs",
  ApiPaneResponseTabs = "ApiPaneResponseTabs",
  ApiPaneResponseHeight = "ApiPaneResponseHeight",
  CanvasDebuggerTabs = "CanvasDebuggerTabs",
  CodeEditorHistory = "CodeEditorHistory",
  EntityCollapsibleState = "EntityCollapsibleState",
  EntityExplorerWidth = "EntityExplorerWidth",
  ExplorerSwitchIndex = "ExplorerSwitchIndex",
  DatasourceViewMode = "DatasourceViewMode",
  DatasourceAccordions = "DatasourceAccordions",
  ApiRightPaneTabs = "ApiRightPaneTabs",
  QueryPaneConfigTabs = "QueryPaneConfigTabs",
  QueryPaneResponseTabs = "QueryPaneResponseTabs",
  QueryPaneResponseHeight = "QueryPaneResponseHeight",
  JSPaneConfigTabs = "JSPaneConfigTabs",
  JSPaneResponseTabs = "JSPaneResponseTabs",
  JSPaneResponseHeight = "JSPaneResponseHeight",
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
        selectWidgetInitAction(SelectionRequestType.Multiple, widgetIds),
      defaultValue: [],
    },
    {
      name: FocusElement.CanvasDebuggerTabs,
      selector: getSelectedCanvasDebuggerTab,
      setter: setCanvasDebuggerSelectedTab,
      defaultValue: 0,
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
      selector: getJSPaneConfigSelectedTabIndex,
      setter: setJsPaneConfigSelectedTabIndex,
      defaultValue: 0,
    },
    {
      name: FocusElement.JSPaneResponseTabs,
      selector: getJSPaneResponseSelectedTab,
      setter: setJsPaneResponseSelectedTab,
      defaultValue: 0,
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
      name: FocusElement.ApiPaneResponseTabs,
      selector: getApiPaneResponseSelectedTab,
      setter: setApiPaneResponseSelectedTab,
      defaultValue: 0,
    },
    {
      name: FocusElement.ApiPaneResponseHeight,
      selector: getApiPaneResponsePaneHeight,
      setter: setApiPaneResponsePaneHeight,
      defaultValue: ActionExecutionResizerHeight,
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
};
