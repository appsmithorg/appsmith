import _ from "lodash";
import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

import { User } from "constants/userConstants";

const initialState: UsersReduxState = {
  loadingStates: {
    fetchingUsers: false,
    fetchingUser: false,
  },
  list: [],
  users: [],
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
    const userIndex = _.findIndex(users, { id: action.payload.id });
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
  [ReduxActionTypes.FETCH_USER_SUCCESS]: (
    state: UsersReduxState,
    action: ReduxAction<User>,
  ) => {
    const users = [...state.list];
    const userIndex = _.findIndex(users, { id: action.payload.id });
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
});

export interface UsersReduxState {
  current?: User;
  list: User[];
  loadingStates: {
    fetchingUser: boolean;
    fetchingUsers: boolean;
  };
  users: User[];
  currentUser?: User;
}

export default usersReducer;
