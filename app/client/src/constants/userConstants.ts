export const ANONYMOUS_USERNAME = "anonymousUser";

type Gender = "MALE" | "FEMALE";

export enum CommentsOnboardingState {
  ONBOARDED = "ONBOARDED",
  SKIPPED = "SKIPPED",
}

export type User = {
  email: string;
  organizationIds: string[];
  username: string;
  name: string;
  gender: Gender;
  emptyInstance?: boolean;
  commentOnboardingState?: CommentsOnboardingState | null;
  photoId?: string;
  isSuperUser: boolean;
  role?: string;
  useCase?: string;
  isConfigurable: boolean;
  enableTelemetry: boolean;
};

export interface UserApplication {
  id: string;
  name: string;
}

export const CurrentUserDetailsRequestPayload = {
  id: "profile",
};

export const DefaultCurrentUserDetails: User = {
  name: ANONYMOUS_USERNAME,
  email: ANONYMOUS_USERNAME,
  organizationIds: [],
  username: ANONYMOUS_USERNAME,
  gender: "MALE",
  isSuperUser: false,
  isConfigurable: false,
  enableTelemetry: false,
};

// TODO keeping it here instead of the USER_API since it leads to cyclic deps errors during tests
export const USER_PHOTO_URL = "v1/users/photo";
export const USER_PHOTO_ASSET_URL = "v1/assets";

export type UserRoleUsecasePayload = {
  role: string;
  useCase: string;
};
