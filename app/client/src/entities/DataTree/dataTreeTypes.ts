import type {
  DataTreeEntityConfig,
  DataTreeEntityObject,
  ActionDispatcher,
  UnEvalTreeEntityObject,
  AppsmithEntity,
} from "@appsmith/entities/DataTree/types";
import type { Page } from "@appsmith/constants/ReduxActionConstants";

export interface unEvalAndConfigTree {
  unEvalTree: UnEvalTree;
  configTree: ConfigTree;
}

export interface ConfigTree {
  [entityName: string]: DataTreeEntityConfig;
}
export type DataTreeEntity = DataTreeEntityObject | Page[] | ActionDispatcher;

export interface DataTree {
  [entityName: string]: DataTreeEntity;
}
export type UnEvalTreeEntity = UnEvalTreeEntityObject | AppsmithEntity | Page[];

export interface UnEvalTree {
  [entityName: string]: UnEvalTreeEntity;
}
