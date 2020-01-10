import { AppState } from "reducers";
import { User } from "constants/userConstants";

export const getCurrentUser = (state: AppState): User | undefined =>
  state.ui.users.current;
export const getUsers = (state: AppState): User[] => state.ui.users.list;
