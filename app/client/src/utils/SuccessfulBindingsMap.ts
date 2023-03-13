export default class SuccessfulBindingMap {
  successfulBindings: Record<string, unknown>;

  constructor(successfulBindings: Record<string, unknown>) {
    this.successfulBindings = successfulBindings;
  }

  set(successfulBindings: Record<string, unknown>) {
    this.successfulBindings = successfulBindings;
  }

  get() {
    return this.successfulBindings;
  }
}
