class UsagePulse {
  static anonymousId: string;

  static initialize(anonymousId: string) {
    if (anonymousId) {
      UsagePulse.anonymousId = anonymousId;
    }
  }
}

export default UsagePulse;
