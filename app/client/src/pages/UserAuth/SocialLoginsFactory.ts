export class SocialLoginsFactory {
  static methods: string[] = [];

  static register(method: string): void {
    SocialLoginsFactory.methods.push(method);
  }
}
