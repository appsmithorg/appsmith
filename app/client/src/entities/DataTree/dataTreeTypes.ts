import type {
  DataTreeEntityConfig,
  DataTreeEntityObject,
  ActionDispatcher,
  UnEvalTreeEntityObject,
  AppsmithEntity,
} from "@appsmith/entities/DataTree/types";
import type { Page } from "@appsmith/constants/ReduxActionConstants";

export type unEvalAndConfigTree = {
  unEvalTree: UnEvalTree;
  configTree: ConfigTree;
};

export type ConfigTree = {
  [entityName: string]: DataTreeEntityConfig;
};
export type DataTreeEntity = DataTreeEntityObject | Page[] | ActionDispatcher;

export type DataTree = {
  [entityName: string]: DataTreeEntity;
};
export type UnEvalTreeEntity = UnEvalTreeEntityObject | AppsmithEntity | Page[];

export type UnEvalTree = {
  [entityName: string]: UnEvalTreeEntity;
};
