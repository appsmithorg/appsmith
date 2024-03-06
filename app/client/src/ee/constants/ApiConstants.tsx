export * from "ce/constants/ApiConstants";
import { OAuthURL } from "ce/constants/ApiConstants";
export const KeycloakOAuthURL = `${OAuthURL}/keycloak`;
export const OIDCOAuthURL = `${OAuthURL}/oidc`;
export const downloadAuditLogAPIRoute = (params = "?") =>
  `/api/v1/audit-logs/export${params}`;
export const logoutApiURL = `/api/v1/logout`;
