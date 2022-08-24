import { getApiPaneSelectedTabIndex } from "selectors/apiPaneSelectors";
import { setApiPaneSelectedTabIndex } from "actions/apiPaneActions";
import { AppState } from "reducers";
import { ReduxAction } from "ce/constants/ReduxActionConstants";

export enum FocusEntity {
  API = "API",
  CANVAS = "CANVAS",
  QUERY = "QUERY",
  PROPERTY_PANE = "PROPERTY_PANE",
}

export enum FocusElement {
  ApiPaneTabs = "ApiPaneTabs",
}

type Config = {
  name: FocusElement;
  selector: (state: AppState) => unknown;
  setter: (payload: any) => ReduxAction<any>;
};

export const FocusElementsConfig: Record<FocusEntity, Config[]> = {
  [FocusEntity.CANVAS]: [],
  [FocusEntity.QUERY]: [],
  [FocusEntity.PROPERTY_PANE]: [],
  [FocusEntity.API]: [
    {
      name: FocusElement.ApiPaneTabs,
      selector: getApiPaneSelectedTabIndex,
      setter: setApiPaneSelectedTabIndex,
    },
  ],
};
