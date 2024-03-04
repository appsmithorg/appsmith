import type { Hint } from "codemirror";
import type { AutocompleteDataType } from "./AutocompleteDataType";
import type { EntityTypeValue } from "@appsmith/entities/DataTree/types";

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

export interface Completion<
  T = {
    doc: string;
  },
> extends Hint {
  origin: string;
  type: AutocompleteDataType | string;
  data: T;
  render?: any;
  isHeader?: boolean;
  recencyWeight?: number;
  isEntityName?: boolean;
}

export interface CommandsCompletion
  extends Omit<Completion, "type" | "origin" | "data"> {
  data: unknown;
  action?: (callback?: (completion: string) => void) => void;
  shortcut?: string;
  triggerCompletionsPostPick?: boolean;
}

export type TernDocs = Record<string, TernDoc>;

export interface TernDoc {
  doc: CodeMirror.Doc;
  name: string;
  changed: { to: number; from: number } | null;
}

export interface TernCompletionResult {
  name: string;
  type?: string | undefined;
  depth?: number | undefined;
  doc?: string | undefined;
  url?: string | undefined;
  origin?: string | undefined;
}

export interface ArgHints {
  start: CodeMirror.Position;
  type: { args: any[]; rettype: null | string };
  name: string;
  guess: boolean;
  doc: CodeMirror.Doc;
}

export interface RequestQuery {
  type: string;
  types?: boolean;
  docs?: boolean;
  urls?: boolean;
  origins?: boolean;
  caseInsensitive?: boolean;
  preferFunction?: boolean;
  end?: CodeMirror.Position;
  guess?: boolean;
  inLiteral?: boolean;
  fullDocs?: any;
  lineCharPositions?: any;
  start?: any;
  file?: any;
  includeKeywords?: boolean;
  depth?: number;
  sort?: boolean;
  expandWordForward?: boolean;
}

export interface DataTreeDefEntityInformation {
  type: EntityTypeValue;
  subType: string;
}
