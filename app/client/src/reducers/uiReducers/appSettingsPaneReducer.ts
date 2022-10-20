import {
  SelectMultipleWidgetsActionPayload,
  SelectWidgetActionPayload,
} from "actions/widgetSelectionActions";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { AppSettingsTabs } from "pages/Editor/AppSettingsPane/AppSettings";
import { createReducer } from "utils/ReducerUtils";

const initialState: AppSettingsPaneReduxState = {
  isOpen: false,
  reopenExplorerOnClose: false,
};

const appSettingsPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.OPEN_APP_SETTINGS_PANE]: (
    state: AppSettingsPaneReduxState,
    action: ReduxAction<AppSettingsPaneContext>,
  ): AppSettingsPaneReduxState => {
    return {
      ...state,
      isOpen: true,
      context: action.payload,
    };
  },
  [ReduxActionTypes.CLOSE_APP_SETTINGS_PANE]: (
    state: AppSettingsPaneReduxState,
  ): AppSettingsPaneReduxState => {
    return {
      ...state,
      isOpen: false,
    };
  },
  [ReduxActionTypes.SELECT_WIDGET]: (
    state: AppSettingsPaneReduxState,
    action: ReduxAction<SelectWidgetActionPayload>,
  ): AppSettingsPaneReduxState => {
    // select widget is also triggered on route change
    // checking widget id to ensure a widget was selected
    return action.payload.widgetId
      ? {
          ...state,
          isOpen: false,
        }
      : { ...state };
  },
  [ReduxActionTypes.SELECT_MULTIPLE_WIDGETS]: (
    state: AppSettingsPaneReduxState,
    action: ReduxAction<SelectMultipleWidgetsActionPayload>,
  ): AppSettingsPaneReduxState => {
    // select multiple widgets is triggered also on canvas click
    // checking widgets length to ensure widgets were selected
    return !(action.payload.widgetIds?.length === 0)
      ? {
          ...state,
          isOpen: false,
        }
      : { ...state };
  },
  [ReduxActionTypes.REOPEN_EXPLORER_ON_SETTINGS_PANE_CLOSE]: (
    state: AppSettingsPaneReduxState,
    action: ReduxAction<boolean>,
  ): AppSettingsPaneReduxState => {
    return {
      ...state,
      reopenExplorerOnClose: action.payload,
    };
  },
});

export interface AppSettingsPaneContext {
  type: AppSettingsTabs;
  pageId?: string;
}

export interface AppSettingsPaneReduxState {
  isOpen: boolean;
  context?: AppSettingsPaneContext;
  reopenExplorerOnClose: boolean;
}

export default appSettingsPaneReducer;
