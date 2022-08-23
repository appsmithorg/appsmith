import { createReducer } from "utils/ReducerUtils";

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

export const handlers = {};

export default createReducer(initialState, handlers);
