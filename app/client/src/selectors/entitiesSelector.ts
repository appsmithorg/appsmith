import { AppState, DataTree } from "../reducers";

export const getDataTree = (state: AppState): DataTree => state.entities;
