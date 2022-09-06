import { getApiPaneSelectedTabIndex } from "selectors/apiPaneSelectors";
import { setApiPaneSelectedTabIndex } from "actions/apiPaneActions";
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

export enum FocusElement {
  ApiPaneTabs = "ApiPaneTabs",
  CodeEditor = "CodeEditor",
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
  [FocusEntity.NONE]: [],
  [FocusEntity.QUERY]: [],
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
      name: FocusElement.ApiPaneTabs,
      selector: getApiPaneSelectedTabIndex,
      setter: setApiPaneSelectedTabIndex,
      defaultValue: 0,
    },
  ],
};
