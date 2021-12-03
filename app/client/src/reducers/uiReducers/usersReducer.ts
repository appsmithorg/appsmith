import _ from "lodash";
import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

import {
  CommentsOnboardingState,
  DefaultCurrentUserDetails,
  User,
} from "constants/userConstants";

const initialState: UsersReduxState = {
  loadingStates: {
    fetchingUsers: false,
    fetchingUser: false,
  },
  list: [],
  users: [],
  error: "",
  current: undefined,
  currentUser: undefined,
  featureFlagFetched: false,
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
  [ReduxActionTypes.FETCH_FEATURE_FLAGS_SUCCESS]: (state: UsersReduxState) => ({
    ...state,
    featureFlagFetched: true,
  }),
  [ReduxActionErrorTypes.FETCH_FEATURE_FLAGS_ERROR]: (
    state: UsersReduxState,
  ) => ({
    ...state,
    featureFlagFetched: true,
  }),
  [ReduxActionTypes.UPDATE_USERS_COMMENTS_ONBOARDING_STATE]: (
    state: UsersReduxState,
    action: ReduxAction<CommentsOnboardingState>,
  ) => ({
    ...state,
    currentUser: {
      ...state.currentUser,
      commentOnboardingState: action.payload,
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
  featureFlagFetched: boolean;
}

export default usersReducer;
