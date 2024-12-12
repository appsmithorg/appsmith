import { ANONYMOUS_USERNAME, type User } from "constants/userConstants";
import { getAppsmithConfigs } from "ee/configs";
import { sha256 } from "js-sha256";

interface TrackedUserProperties {
  userId: string;
  source: string;
  email?: string;
  name?: string;
  emailVerified?: boolean;
}

/**
 * Function to get the application id from the URL
 * @param location current location object based on URL
 * @returns application id
 */
export function getApplicationId(location: Location) {
  const pathSplit = location.pathname.split("/");
  const applicationsIndex = pathSplit.findIndex(
    (path) => path === "applications",
  );

  return pathSplit[applicationsIndex + 1];
}

class TrackedUser {
  private static instance: TrackedUser;
  private readonly user: User;
  private readonly userId: string;
  public readonly selfHosted: boolean;

  protected constructor(user: User) {
    this.user = user;
    const { cloudHosting, segment } = getAppsmithConfigs();

    this.selfHosted = !(segment.apiKey || cloudHosting);

    if (this.selfHosted) {
      this.userId = sha256(user.username);
    } else {
      this.userId = user.username;
    }
  }

  static init(user: User) {
    if (!TrackedUser.instance) {
      TrackedUser.instance = new TrackedUser(user);
    }
  }

  static getInstance(): TrackedUser {
    if (!TrackedUser.instance) {
      throw new Error("TrackedUser is not initialized. Call init() first.");
    }

    return TrackedUser.instance;
  }

  protected getUserSource(): string {
    return this.selfHosted ? "ce" : "cloud";
  }

  public getUser(): TrackedUserProperties {
    if (this.selfHosted) {
      return this.getAnonymousUserDetails();
    } else {
      return this.getAllUserDetails();
    }
  }

  public getEventUserProperties() {
    const { email, userId } = this.getUser();

    if (this.userId === ANONYMOUS_USERNAME) {
      return undefined;
    }

    const appId = getApplicationId(window.location);

    return {
      userId,
      email,
      appId: this.selfHosted ? undefined : appId,
    };
  }

  private getAllUserDetails() {
    const { email, emailVerified, name } = this.user;
    const source = this.getUserSource();

    return {
      userId: this.userId,
      source,
      email,
      name,
      emailVerified,
    };
  }

  private getAnonymousUserDetails() {
    const source = this.getUserSource();

    return {
      userId: this.userId,
      source,
    };
  }
}

export default TrackedUser;
