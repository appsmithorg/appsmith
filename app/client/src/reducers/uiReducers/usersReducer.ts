import _ from "lodash";
import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "../../actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";

import type { User } from "constants/userConstants";
import { DefaultCurrentUserDetails } from "constants/userConstants";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import { DEFAULT_FEATURE_FLAG_VALUE } from "ee/entities/FeatureFlag";
import type { OverriddenFeatureFlags } from "utils/hooks/useFeatureFlagOverride";

const initialState: UsersReduxState = {
  loadingStates: {
    fetchingUsers: false,
    fetchingUser: true,
  },
  list: [],
  users: [],
  error: "",
  current: undefined,
  currentUser: undefined,
  featureFlag: {
    data: DEFAULT_FEATURE_FLAG_VALUE,
    overriddenFlags: {},
    isFetched: false,
    isFetching: true,
  },
  productAlert: {
    config: {
      dismissed: false,
      snoozeTill: new Date(),
    },
  },
};

const usersReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_USER_INIT]: (state: UsersReduxState) => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      fetchingUser: true,
    },
  }),
  [ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS]: (
    state: UsersReduxState,
    action: ReduxAction<User>,
  ) => {
    const users = [...state.users];
    const userIndex = _.findIndex(users, { username: action.payload.username });

    if (userIndex > -1) {
      users[userIndex] = action.payload;
    } else {
      users.push(action.payload);
    }

    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        fetchingUser: false,
      },
      users,
      currentUser: action.payload,
    };
  },
  [ReduxActionTypes.UPDATE_USER_DETAILS_SUCCESS]: (
    state: UsersReduxState,
    action: ReduxAction<User>,
  ) => {
    const users = [...state.users];
    const userIndex = _.findIndex(users, { username: action.payload.username });

    if (userIndex > -1) {
      users[userIndex] = action.payload;
    } else {
      users.push(action.payload);
    }

    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        fetchingUser: false,
      },
      users,
      currentUser: {
        ...state.currentUser,
        ...action.payload,
      },
    };
  },
  [ReduxActionTypes.UPDATE_USER_INTERCOM_CONSENT]: (state: UsersReduxState) => {
    return {
      ...state,
      currentUser: {
        ...state.currentUser,
        isIntercomConsentGiven: true,
      },
    };
  },
  [ReduxActionTypes.FETCH_USER_SUCCESS]: (
    state: UsersReduxState,
    action: ReduxAction<User>,
  ) => {
    const users = [...state.list];
    const userIndex = _.findIndex(users, { username: action.payload.username });

    if (userIndex > -1) {
      users[userIndex] = action.payload;
    } else {
      users.push(action.payload);
    }

    return {
      ...state,
      loadingStates: {
        ...state.loadingStates,
        fetchingUser: false,
      },
      list: users,
    };
  },
  [ReduxActionErrorTypes.FETCH_USER_DETAILS_ERROR]: (
    state: UsersReduxState,
    action: ReduxAction<{ error: string }>,
  ) => ({
    ...initialState,
    error: action.payload.error,
    loadingStates: { ...state.loadingStates, fetchingUser: false },
  }),
  [ReduxActionErrorTypes.FETCH_USER_ERROR]: (state: UsersReduxState) => ({
    ...state,
    loadingStates: { ...state.loadingStates, fetchingUser: false },
  }),
  [ReduxActionTypes.LOGOUT_USER_SUCCESS]: (
    state: UsersReduxState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    current: undefined,
    currentUser: {
      ...DefaultCurrentUserDetails,
      emptyInstance: action.payload,
    },
    users: [
      {
        ...DefaultCurrentUserDetails,
        emptyInstance: action.payload,
      },
    ],
  }),
  [ReduxActionTypes.UPDATE_PHOTO_ID]: (
    state: UsersReduxState,
    action: ReduxAction<{ photoId: string }>,
  ) => ({
    ...state,
    currentUser: {
      ...state.currentUser,
      photoId: action.payload.photoId,
    },
  }),
  [ReduxActionTypes.FETCH_FEATURE_FLAGS_INIT]: (state: UsersReduxState) => ({
    ...state,
    featureFlag: {
      ...state.featureFlag,
      isFetched: false,
      isFetching: true,
    },
  }),
  [ReduxActionTypes.FETCH_FEATURE_FLAGS_SUCCESS]: (
    state: UsersReduxState,
    action: ReduxAction<FeatureFlags>,
  ) => ({
    ...state,
    featureFlag: {
      data: action.payload,
      isFetched: true,
      isFetching: false,
    },
  }),
  [ReduxActionTypes.FETCH_OVERRIDDEN_FEATURE_FLAGS]: (
    state: UsersReduxState,
    action: ReduxAction<FeatureFlags>,
  ) => ({
    ...state,
    featureFlag: {
      ...state.featureFlag,
      overriddenFlags: action.payload,
    },
  }),
  [ReduxActionTypes.UPDATE_OVERRIDDEN_FEATURE_FLAGS]: (
    state: UsersReduxState,
    action: ReduxAction<FeatureFlags>,
  ) => ({
    ...state,
    featureFlag: {
      ...state.featureFlag,
      overriddenFlags: {
        ...state.featureFlag.overriddenFlags,
        ...action.payload,
      },
    },
  }),
  [ReduxActionErrorTypes.FETCH_FEATURE_FLAGS_ERROR]: (
    state: UsersReduxState,
  ) => ({
    ...state,
    featureFlag: {
      data: {},
      isFetched: true,
      isFetching: false,
    },
  }),
  [ReduxActionTypes.FETCH_PRODUCT_ALERT_SUCCESS]: (
    state: UsersReduxState,
    action: ReduxAction<ProductAlert>,
  ) => ({
    ...state,
    productAlert: action.payload,
  }),
  [ReduxActionTypes.UPDATE_PRODUCT_ALERT_CONFIG]: (
    state: UsersReduxState,
    action: ReduxAction<ProductAlertConfig>,
  ): UsersReduxState => ({
    ...state,
    productAlert: {
      ...state.productAlert,
      config: action.payload,
    },
  }),
});

export interface PropertyPanePositionConfig {
  isMoved: boolean;
  position: {
    left: number;
    top: number;
  };
}

export interface ProductAlert {
  messageId: string;
  title: string;
  message: string;
  canDismiss: boolean;
  remindLaterDays: number;
  learnMoreLink?: string;
}

export interface ProductAlertConfig {
  dismissed: boolean;
  snoozeTill: Date;
}

export interface ProductAlertState {
  message?: ProductAlert;
  config: ProductAlertConfig;
}

export interface UsersReduxState {
  current?: User;
  list: User[];
  loadingStates: {
    fetchingUser: boolean;
    fetchingUsers: boolean;
  };
  users: User[];
  currentUser?: User;
  error: string;
  propPanePreferences?: PropertyPanePositionConfig;
  featureFlag: {
    isFetched: boolean;
    data: FeatureFlags;
    isFetching: boolean;
    overriddenFlags: OverriddenFeatureFlags;
  };
  productAlert: ProductAlertState;
}

export default usersReducer;
