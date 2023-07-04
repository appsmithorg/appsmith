import localStorage from "./localStorage";

const FEATURE_FLAG_KEY = "appsmith_feature_walkthrough";

class FeatureFlagWalkthroughUtils {
  static setFeatureFlagShownStatus(key: string, value: any) {
    let flagsJSON = this.getAllFlags();
    if (typeof flagsJSON === "object") {
      flagsJSON[key] = value;
    } else {
      flagsJSON = { [key]: value };
    }
    localStorage.setItem(FEATURE_FLAG_KEY, JSON.stringify(flagsJSON));
  }

  private static getAllFlags() {
    let flagsJSON: any = localStorage.getItem(FEATURE_FLAG_KEY) || "{}";
    try {
      flagsJSON = JSON.parse(flagsJSON);
    } catch {}

    return flagsJSON;
  }

  static getFeatureFlagShownStatus(key: string) {
    const flagsJSON = this.getAllFlags();
    return !!flagsJSON[key];
  }
}

export default FeatureFlagWalkthroughUtils;
