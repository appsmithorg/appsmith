import type { UnEvalTreeEntity } from "@appsmith/entities/DataTree/types";

export type SuccessfulBindings = {
  [entityName: string]: UnEvalTreeEntity;
};
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
