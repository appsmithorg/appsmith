import {
  default as ThirdPartyAuth,
  SocialLoginTypes as CE_SocialLoginTypes,
} from "ce/pages/UserAuth/ThirdPartyAuth";
import { getAppsmithConfigs } from "@appsmith/configs";
import { ThirdPartyLoginRegistry } from "pages/UserAuth/ThirdPartyLoginRegistry";
const { enableGithubOAuth, enableGoogleOAuth } = getAppsmithConfigs();

export const SocialLoginTypes = CE_SocialLoginTypes;

if (enableGoogleOAuth)
  ThirdPartyLoginRegistry.register(SocialLoginTypes.GOOGLE);
if (enableGithubOAuth)
  ThirdPartyLoginRegistry.register(SocialLoginTypes.GITHUB);

export default ThirdPartyAuth;
