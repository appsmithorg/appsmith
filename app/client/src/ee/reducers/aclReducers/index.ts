import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";
import { groupsReducers } from "./groupsReducer";
import { rolesReducers } from "./rolesReducer";
import { userReducers } from "./usersReducer";
import type {
  GroupProps,
  RoleProps,
  UserProps,
} from "@appsmith/pages/AdminSettings/AccessControl/types";

export const initialState: AclReduxState = {
  isLoading: false,
  isSaving: false,
  isEditing: false,
  users: [],
  groups: [],
  roles: [],
  selectedUser: null,
  selectedGroup: null,
  selectedRole: null,
  inviteOptions: {
    roles: [],
    groups: [],
  },
  iconLocations: [],
};

export interface AclReduxState {
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  users: UserProps[];
  groups: GroupProps[];
  roles: RoleProps[];
  selectedUser: UserProps | null;
  selectedGroup: GroupProps | null;
  selectedRole: RoleProps | null;
  inviteOptions: {
    roles: any[];
    groups: any[];
  };
  iconLocations: any[];
}

export const handlers = {
  ...userReducers,
  ...groupsReducers,
  ...rolesReducers,
  [ReduxActionTypes.ACL_IS_EDITING]: (state: any, action: any) => ({
    ...state,
    isEditing: action.payload,
  }),
};

export default createReducer(initialState, handlers);
