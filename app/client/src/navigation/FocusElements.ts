import {
  getApiPaneConfigSelectedTabIndex,
  getApiPaneResponsePaneHeight,
  getApiPaneResponseSelectedTabIndex,
} from "selectors/apiPaneSelectors";
import {
  setApiPaneResponseSelectedTabIndex,
  setApiPaneConfigSelectedTabIndex,
  setApiPaneResponsePaneHeight,
} from "actions/apiPaneActions";
import { AppState } from "@appsmith/reducers";
import { ReduxAction } from "ce/constants/ReduxActionConstants";
import {
  getAllPropertySectionState,
  getFocusableField,
  getSelectedPropertyTabIndex,
} from "selectors/editorContextSelectors";
import {
  setAllPropertySectionState,
  setFocusableField,
  setSelectedPropertyTabIndex,
} from "actions/editorContextActions";
import { getSelectedWidgets } from "selectors/ui";
import { selectMultipleWidgetsInitAction } from "actions/widgetSelectionActions";

import { FocusEntity } from "navigation/FocusEntity";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import {
  getQueryPaneConfigSelectedTabIndex,
  getQueryPaneResponsePaneHeight,
  getQueryPaneResponseSelectedTabIndex,
} from "selectors/queryPaneSelectors";
import {
  setQueryPaneConfigSelectedTabIndex,
  setQueryPaneResponsePaneHeight,
  setQueryPaneResponseSelectedTabIndex,
} from "actions/queryPaneActions";
import {
  getJSPaneConfigSelectedTabIndex,
  getJSPaneResponsePaneHeight,
  getJSPaneResponseSelectedTabIndex,
} from "selectors/jsPaneSelectors";
import {
  setJsPaneConfigSelectedTabIndex,
  setJsPaneResponsePaneHeight,
  setJsPaneResponseSelectedTabIndex,
} from "actions/jsPaneActions";

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
}

type Config = {
  name: FocusElement;
  selector: (state: AppState) => unknown;
  setter: (payload: any) => ReduxAction<any>;
  defaultValue?: unknown;
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
      selector: getJSPaneResponseSelectedTabIndex,
      setter: setJsPaneResponseSelectedTabIndex,
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
      selector: getQueryPaneResponseSelectedTabIndex,
      setter: setQueryPaneResponseSelectedTabIndex,
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
    },
    {
      name: FocusElement.ApiPaneResponseTabs,
      selector: getApiPaneResponseSelectedTabIndex,
      setter: setApiPaneResponseSelectedTabIndex,
      defaultValue: 0,
    },
    {
      name: FocusElement.ApiPaneResponseHeight,
      selector: getApiPaneResponsePaneHeight,
      setter: setApiPaneResponsePaneHeight,
      defaultValue: ActionExecutionResizerHeight,
    },
  ],
};
