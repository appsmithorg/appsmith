export class ThirdPartyLoginRegistry {
  private static methods: string[] = [];

  static register(method: string): void {
    ThirdPartyLoginRegistry.methods.push(method);
  }

  static get(): string[] {
    return ThirdPartyLoginRegistry.methods;
  }
}
