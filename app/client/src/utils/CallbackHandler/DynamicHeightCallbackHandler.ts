import BaseCallbackHandler from "./BaseCallbackHandler";

class DynamicHeightCallbackHandler extends BaseCallbackHandler {
  private static instance: DynamicHeightCallbackHandler;

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    super();
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): DynamicHeightCallbackHandler {
    if (!DynamicHeightCallbackHandler.instance) {
      DynamicHeightCallbackHandler.instance = new DynamicHeightCallbackHandler();
    }

    return DynamicHeightCallbackHandler.instance;
  }
}

export default DynamicHeightCallbackHandler.getInstance();
