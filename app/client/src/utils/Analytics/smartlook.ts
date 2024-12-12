import smartlookClient from "smartlook-client";
import { getAppsmithConfigs } from "ee/configs";

class SmartlookUtil {
  static initialised: boolean = false;

  public static init() {
    const {
      smartLook: { enabled, id },
    } = getAppsmithConfigs();

    if (enabled && !this.initialised) {
      smartlookClient.init(id);
      this.initialised = true;
    }
  }
}

export default SmartlookUtil;
