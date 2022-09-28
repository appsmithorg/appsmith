import {
  GroupProps,
  RoleProps,
  UserProps,
} from "@appsmith/pages/AdminSettings/acl/types";
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
  users: UserProps[];
  groups: GroupProps[];
  roles: RoleProps[];
  selectedUser: UserProps | null;
  selectedGroup: GroupProps | null;
  selectedRole: RoleProps | null;
}

export const handlers = {
  ...userReducers,
  ...groupsReducers,
  ...rolesReducers,
};

export default createReducer(initialState, handlers);
