export const ANONYMOUS_USERNAME = "anonymousUser";

export type User = {
  id: string;
  email: string;
  currentOrganizationId: string;
  organizationIds: string[];
  applications: UserApplication[];
  username: string;
};

export interface UserApplication {
  id: string;
  name: string;
}

export const CurrentUserDetailsRequestPayload = {
  id: "profile",
};
