export const ANONYMOUS_USERNAME = "anonymousUser";

type Gender = "MALE" | "FEMALE";

export type User = {
  email: string;
  currentOrganizationId: string;
  organizationIds: string[];
  applications: UserApplication[];
  username: string;
  name: string;
  gender: Gender;
  anonymousId: string;
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
  currentOrganizationId: "",
  organizationIds: [],
  username: ANONYMOUS_USERNAME,
  applications: [],
  gender: "MALE",
  anonymousId: "anonymousId",
};

// TODO keeping it here instead of the USER_API since it leads to cyclic deps errors during tests
export const USER_PHOTO_URL = "v1/users/photo";
