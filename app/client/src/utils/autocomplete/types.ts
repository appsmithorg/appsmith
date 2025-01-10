import type { Def } from "tern";

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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CallbackFn = (...args: any) => any;

export type ExtraDef = Record<string, Def | string>;
