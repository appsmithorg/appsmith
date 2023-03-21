export type SuccessfulBindings = Record<string, string>;
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
