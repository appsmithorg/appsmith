import { createReducer } from "utils/ReducerUtils";
import { groupsReducers } from "./groupsReducer";
import { rolesReducers } from "./rolesReducer";
import { userReducers } from "./usersReducer";

export const initialState: AclReduxState = {
  isLoading: false,
  isSaving: false,
  users: [],
  groups: [],
  roles: [],
  selectedUser: null,
  selectedGroup: null,
  selectedRole: null,
};

export interface AclReduxState {
  isLoading: boolean;
  isSaving: boolean;
  users: any[];
  groups: any[];
  roles: any[];
  selectedUser: any;
  selectedGroup: any;
  selectedRole: any;
}

export const handlers = {
  ...userReducers,
  ...groupsReducers,
  ...rolesReducers,
};

export default createReducer(initialState, handlers);
