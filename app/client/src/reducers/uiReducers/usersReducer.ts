import _ from "lodash";
import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";

import type { User } from "constants/userConstants";
import { DefaultCurrentUserDetails } from "constants/userConstants";
import type FeatureFlags from "entities/FeatureFlags";

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
    data: {},
    isFetched: false,
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
  [ReduxActionTypes.PROP_PANE_MOVED]: (
    state: UsersReduxState,
    action: ReduxAction<PropertyPanePositionConfig>,
  ) => ({
    ...state,
    propPanePreferences: {
      isMoved: true,
      position: {
        ...action.payload.position,
      },
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
  [ReduxActionTypes.SET_CURRENT_USER_SUCCESS]: (
    state: UsersReduxState,
    action: ReduxAction<User>,
  ) => ({
    ...state,
    current: action.payload,
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
  [ReduxActionTypes.FETCH_FEATURE_FLAGS_SUCCESS]: (
    state: UsersReduxState,
    action: ReduxAction<FeatureFlags>,
  ) => ({
    ...state,
    featureFlag: {
      data: action.payload,
      isFetched: true,
    },
  }),
  [ReduxActionErrorTypes.FETCH_FEATURE_FLAGS_ERROR]: (
    state: UsersReduxState,
  ) => ({
    ...state,
    featureFlag: {
      data: {},
      isFetched: true,
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
  };
}

export default usersReducer;
