import type { UnEvalTreeEntity } from "entities/DataTree/dataTreeTypes";

export interface SuccessfulBindings {
  [entityName: string]: UnEvalTreeEntity;
}
export default class SuccessfulBindingMap {
  successfulBindings: SuccessfulBindings;

  constructor(successfulBindings: SuccessfulBindings) {
    this.successfulBindings = successfulBindings;
  }

  set(successfulBindings: SuccessfulBindings) {
    this.successfulBindings = successfulBindings;
  }

  get() {
    return this.successfulBindings;
  }
}
