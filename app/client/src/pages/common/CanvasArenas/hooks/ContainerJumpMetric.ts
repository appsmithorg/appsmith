//class to maintain containerJump metrics across containers.
export default class ContainerJumpMetrics<T> {
  private containerJumpValues: T = {} as T;

  public setMetrics(args: T) {
    this.containerJumpValues = {
      ...args,
    };
  }

  public getMetrics() {
    return {
      ...this.containerJumpValues,
    };
  }

  public clearMetrics() {
    this.containerJumpValues = {} as T;
  }
}
