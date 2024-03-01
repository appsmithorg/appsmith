import {
  setApiPaneConfigSelectedTabIndex,
  setApiPaneDebuggerState,
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
  getApiPaneDebuggerState,
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
  getDefaultSelectedWidgetIds,
  getDsViewModeValues,
  getSelectedWidgets,
} from "selectors/ui";

import { setDatasourceViewMode } from "actions/datasourceActions";
import { updateExplorerWidthAction } from "actions/explorerActions";
import {
  setJsPaneConfigSelectedTab,
  setJsPaneDebuggerState,
} from "actions/jsPaneActions";
import {
  setAllPropertySectionState,
  setFocusablePropertyPaneField,
  setPropertyPaneWidthAction,
  setSelectedPropertyPanels,
} from "actions/propertyPaneActions";
import {
  setQueryPaneConfigSelectedTabIndex,
  setQueryPaneDebuggerState,
} from "actions/queryPaneActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import {
  DEFAULT_ENTITY_EXPLORER_WIDTH,
  DEFAULT_PROPERTY_PANE_WIDTH,
} from "constants/AppConstants";
import { PluginPackageName } from "entities/Action";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getExplorerWidth } from "selectors/explorerSelector";
import {
  getFirstJSObject,
  getJSPaneConfigSelectedTab,
  getJsPaneDebuggerState,
} from "selectors/jsPaneSelectors";
import {
  getFocusablePropertyPaneField,
  getPropertyPaneWidth,
  getSelectedPropertyPanel,
} from "selectors/propertyPaneSelectors";
import {
  getFirstQuery,
  getQueryPaneConfigSelectedTabIndex,
  getQueryPaneDebuggerState,
} from "selectors/queryPaneSelectors";
import { getDebuggerContext } from "selectors/debuggerSelectors";
import { setDebuggerContext } from "actions/debuggerActions";
import { DefaultDebuggerContext } from "reducers/uiReducers/debuggerReducer";
import { NavigationMethod } from "../../../utils/history";
import { JSEditorTab } from "reducers/uiReducers/jsPaneReducer";
import {
  getSelectedDatasourceId,
  getSelectedSegment,
} from "@appsmith/navigation/FocusSelectors";
import {
  setSelectedDatasource,
  setSelectedJSObject,
  setSelectedQuery,
  setSelectedSegment,
} from "@appsmith/navigation/FocusSetters";
import { getFirstDatasourceId } from "selectors/datasourceSelectors";
import { FocusElement, FocusElementConfigType } from "navigation/FocusElements";
import type { FocusElementsConfigList } from "sagas/FocusRetentionSaga";
import { getJSTabs, getQueryTabs } from "selectors/ideSelectors";
import { setJSTabs, setQueryTabs } from "actions/ideActions";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";

export const AppIDEFocusElements: FocusElementsConfigList = {
  [FocusEntity.DATASOURCE_LIST]: [
    {
      type: FocusElementConfigType.URL,
      name: FocusElement.SelectedDatasource,
      selector: getSelectedDatasourceId,
      setter: setSelectedDatasource,
      defaultValue: getFirstDatasourceId,
    },
  ],
  [FocusEntity.DATASOURCE]: [
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.DatasourceViewMode,
      selector: getDsViewModeValues,
      setter: setDatasourceViewMode,
      defaultValue: { datasourceId: "", viewMode: true },
    },
  ],
  [FocusEntity.JS_OBJECT]: [
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.InputField,
      selector: getFocusableInputField,
      setter: setFocusableInputField,
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.JSPaneConfigTabs,
      selector: getJSPaneConfigSelectedTab,
      setter: setJsPaneConfigSelectedTab,
      defaultValue: JSEditorTab.CODE,
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.JSDebugger,
      selector: getJsPaneDebuggerState,
      setter: setJsPaneDebuggerState,
      defaultValue: {
        open: false,
        responseTabHeight: ActionExecutionResizerHeight,
        selectedTab: undefined,
      },
    },
  ],
  [FocusEntity.QUERY]: [
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.InputField,
      selector: getFocusableInputField,
      setter: setFocusableInputField,
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.QueryPaneConfigTabs,
      selector: getQueryPaneConfigSelectedTabIndex,
      setter: setQueryPaneConfigSelectedTabIndex,
      defaultValue: 0,
    },
    {
      type: FocusElementConfigType.Redux,
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
      type: FocusElementConfigType.Redux,
      name: FocusElement.InputField,
      selector: getFocusableInputField,
      setter: setFocusableInputField,
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.ApiRightPaneTabs,
      selector: getApiRightPaneSelectedTab,
      setter: setApiRightPaneSelectedTab,
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.QueryDebugger,
      selector: getQueryPaneDebuggerState,
      setter: setQueryPaneDebuggerState,
      defaultValue: {
        open: false,
        responseTabHeight: ActionExecutionResizerHeight,
        selectedTab: undefined,
      },
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.ApiDebugger,
      selector: getApiPaneDebuggerState,
      setter: setApiPaneDebuggerState,
      defaultValue: {
        open: false,
        responseTabHeight: ActionExecutionResizerHeight,
        selectedTab: undefined,
      },
    },
  ],
  [FocusEntity.PROPERTY_PANE]: [
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.PropertyPanelContext,
      selector: getPropertyPanelState,
      setter: setPanelPropertiesState,
      defaultValue: {},
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.PropertySections,
      selector: getAllPropertySectionState,
      setter: setAllPropertySectionState,
      defaultValue: {},
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.SelectedPropertyPanel,
      selector: getSelectedPropertyPanel,
      setter: setSelectedPropertyPanels,
      defaultValue: {},
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.PropertyTabs,
      selector: getWidgetSelectedPropertyTabIndex,
      setter: setWidgetSelectedPropertyTabIndex,
      defaultValue: 0,
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.PropertyField,
      selector: getFocusablePropertyPaneField,
      setter: setFocusablePropertyPaneField,
      defaultValue: "",
    },
  ],
  [FocusEntity.DEBUGGER]: [
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.DebuggerContext,
      selector: getDebuggerContext,
      setter: setDebuggerContext,
      defaultValue: DefaultDebuggerContext,
    },
  ],
  [FocusEntity.QUERY_LIST]: [
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.IDETabs,
      selector: getQueryTabs,
      setter: setQueryTabs,
      defaultValue: [],
      persist: true,
    },
    {
      type: FocusElementConfigType.URL,
      name: FocusElement.SelectedQuery,
      selector: identifyEntityFromPath,
      setter: setSelectedQuery,
      defaultValue: getFirstQuery,
    },
  ],
  [FocusEntity.JS_OBJECT_LIST]: [
    {
      type: FocusElementConfigType.URL,
      name: FocusElement.SelectedJSObject,
      selector: identifyEntityFromPath,
      setter: setSelectedJSObject,
      defaultValue: getFirstJSObject,
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.IDETabs,
      selector: getJSTabs,
      setter: setJSTabs,
      defaultValue: [],
      persist: true,
    },
  ],
  [FocusEntity.WIDGET_LIST]: [
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.SelectedWidgets,
      selector: getSelectedWidgets,
      setter: (widgetIds: string[]) =>
        selectWidgetInitAction(
          SelectionRequestType.Multiple,
          widgetIds,
          NavigationMethod.ContextSwitching,
        ),
      defaultValue: getDefaultSelectedWidgetIds,
    },
  ],
  [FocusEntity.EDITOR]: [
    {
      type: FocusElementConfigType.URL,
      name: FocusElement.SelectedSegment,
      selector: getSelectedSegment,
      setter: setSelectedSegment,
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.EntityExplorerWidth,
      selector: getExplorerWidth,
      setter: updateExplorerWidthAction,
      defaultValue: DEFAULT_ENTITY_EXPLORER_WIDTH,
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.EntityCollapsibleState,
      selector: getAllEntityCollapsibleStates,
      setter: setAllEntityCollapsibleStates,
      defaultValue: {},
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.SubEntityCollapsibleState,
      selector: getAllSubEntityCollapsibleStates,
      setter: setAllSubEntityCollapsibleStates,
      defaultValue: {},
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.ExplorerSwitchIndex,
      selector: getExplorerSwitchIndex,
      setter: setExplorerSwitchIndex,
      defaultValue: 0,
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.CodeEditorHistory,
      selector: getCodeEditorHistory,
      setter: setCodeEditorHistory,
      defaultValue: {},
    },
    {
      type: FocusElementConfigType.Redux,
      name: FocusElement.PropertyPaneWidth,
      selector: getPropertyPaneWidth,
      setter: setPropertyPaneWidthAction,
      defaultValue: DEFAULT_PROPERTY_PANE_WIDTH,
    },
  ],
};

export default AppIDEFocusElements;
