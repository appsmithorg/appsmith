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
};
