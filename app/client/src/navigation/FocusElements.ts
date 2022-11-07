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
import { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  getAllPropertySectionState,
  getFocusableField,
  getSelectedCanvasDebuggerTab,
  getSelectedPropertyTabIndex,
} from "selectors/editorContextSelectors";
import { setFocusableField } from "actions/editorContextActions";
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
import {
  setAllPropertySectionState,
  setSelectedPropertyTabIndex,
} from "actions/propertyPaneActions";
import { setCanvasDebuggerSelectedTab } from "actions/debuggerActions";
import { PluginPackageName } from "entities/Action";

export enum FocusElement {
  ApiPaneConfigTabs = "ApiPaneConfigTabs",
  ApiPaneResponseTabs = "ApiPaneResponseTabs",
  ApiPaneResponseHeight = "ApiPaneResponseHeight",
  QueryPaneConfigTabs = "QueryPaneConfigTabs",
  QueryPaneResponseTabs = "QueryPaneResponseTabs",
  QueryPaneResponseHeight = "QueryPaneResponseHeight",
  JSPaneConfigTabs = "JSPaneConfigTabs",
  JSPaneResponseTabs = "JSPaneResponseTabs",
  JSPaneResponseHeight = "JSPaneResponseHeight",
  PropertyField = "PropertyField",
  PropertySections = "PropertySections",
  PropertyTabs = "PropertyTabs",
  SelectedWidgets = "SelectedWidgets",
  CanvasDebuggerTabs = "CanvasDebuggerTabs",
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
      name: FocusElement.PropertyTabs,
      selector: getSelectedPropertyTabIndex,
      setter: setSelectedPropertyTabIndex,
      defaultValue: 0,
    },
    {
      name: FocusElement.PropertyField,
      selector: getFocusableField,
      setter: setFocusableField,
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
    },
    {
      name: FocusElement.ApiPaneResponseHeight,
      selector: getApiPaneResponsePaneHeight,
      setter: setApiPaneResponsePaneHeight,
      defaultValue: ActionExecutionResizerHeight,
    },
  ],
};
