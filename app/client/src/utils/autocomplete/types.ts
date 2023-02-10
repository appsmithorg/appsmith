export enum TernWorkerAction {
  INIT = "INIT",
  ADD_FILE = "ADD_FILE",
  DELETE_FILE = "DELETE_FILE",
  REQUEST = "REQUEST",
  GET_FILE = "GET_FILE",
  DELETE_DEF = "DELETE_DEF",
  ADD_DEF = "ADD_DEF",
  DEBUG = "DEBUG",
}

export type CallbackFn = (...args: any) => any;
