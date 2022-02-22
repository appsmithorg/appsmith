import {
  default as ThirdPartyAuth,
  SocialLoginTypes as CE_SocialLoginTypes,
} from "ce/pages/UserAuth/ThirdPartyAuth";
import { getAppsmithConfigs } from "@appsmith/configs";
import { ThirdPartyLoginRegistry } from "pages/UserAuth/ThirdPartyLoginRegistry";
const {
  enableGithubOAuth,
  enableGoogleOAuth,
  enableKeycloakOAuth,
  enableOidcOAuth,
} = getAppsmithConfigs();

export const SocialLoginTypes = {
  ...CE_SocialLoginTypes,
  KEYCLOAK: "keycloak",
  OIDC: "oidc",
};

if (enableGoogleOAuth)
  ThirdPartyLoginRegistry.register(SocialLoginTypes.GOOGLE);
if (enableGithubOAuth)
  ThirdPartyLoginRegistry.register(SocialLoginTypes.GITHUB);
if (enableKeycloakOAuth)
  ThirdPartyLoginRegistry.register(SocialLoginTypes.KEYCLOAK);
if (enableOidcOAuth) ThirdPartyLoginRegistry.register(SocialLoginTypes.OIDC);

export default ThirdPartyAuth;
