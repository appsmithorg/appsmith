import { captureException } from "instrumentation/sendFaroErrors";
import type { User } from "constants/userConstants";

class FaroUtil {
  static init() {
    // No initialization needed
  }

  public static identifyUser(userId: string, userData: User) {
    // Set user context for error reporting
    window.faro?.api.setUser({
      id: userId,
      username: userData.username,
      email: userData.email,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static captureException(error: Error, context?: any) {
    captureException(error, context);
  }
}

export default FaroUtil;
