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
