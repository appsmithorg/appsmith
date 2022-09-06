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
import { getFocusableField } from "selectors/editorContextSelectors";
import { setFocusableField } from "actions/editorContextActions";
import { getSelectedWidgets } from "selectors/ui";
import { selectMultipleWidgetsInitAction } from "actions/widgetSelectionActions";

import { FocusEntity } from "navigation/FocusEntity";
import { ActionExecutionResizerHeight } from "components/editorComponents/ApiResponseView";

export enum FocusElement {
  ApiPaneConfigTabs = "ApiPaneConfigTabs",
  ApiPaneResponseTabs = "ApiPaneResponseTabs",
  ApiPaneResponseHeight = "ApiPaneResponseHeight",
  PropertyField = "PropertyField",
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
      name: FocusElement.SelectedWidgets,
      selector: getSelectedWidgets,
      setter: selectMultipleWidgetsInitAction,
    },
  ],
  [FocusEntity.NONE]: [],
  [FocusEntity.QUERY]: [],
  [FocusEntity.PROPERTY_PANE]: [
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
