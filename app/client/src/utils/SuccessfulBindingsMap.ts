export default class SuccessfulBindingMap {
  successfulBindings: Record<string, unknown>;

  constructor(successfulBindings: Record<string, unknown>) {
    this.successfulBindings = successfulBindings;
  }

  setSuccessfulBindings(successfulBindings: Record<string, unknown>) {
    this.successfulBindings = successfulBindings;
  }

  getSuccessfulBindings() {
    return this.successfulBindings;
  }
}
