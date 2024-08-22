import type {
  AppsmithEntity,
  DataTreeEntityConfig,
  DataTreeEntityObject,
  UnEvalTreeEntityObject,
} from "ee/entities/DataTree/types";

export interface unEvalAndConfigTree {
  unEvalTree: UnEvalTree;
  configTree: ConfigTree;
}

export interface ConfigTree {
  [entityName: string]: DataTreeEntityConfig;
}
export type DataTreeEntity = DataTreeEntityObject;

export interface DataTree {
  [entityName: string]: DataTreeEntity;
}
export type UnEvalTreeEntity = UnEvalTreeEntityObject | AppsmithEntity;

export interface UnEvalTree {
  [entityName: string]: UnEvalTreeEntity;
}
