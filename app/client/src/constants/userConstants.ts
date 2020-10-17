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

export const DefaultCurrentUserDetails = {
  userPermissions: [],
  name: "anonymousUser",
  email: "anonymousUser",
  source: "FORM",
  isEnabled: true,
  currentOrganizationId: "",
  organizationIds: [],
  groupIds: [],
  permissions: [],
  isAnonymous: true,
  enabled: true,
  username: "anonymousUser",
  accountNonExpired: true,
  accountNonLocked: true,
  credentialsNonExpired: true,
  claims: {},
  address: {},
  new: true,
};
