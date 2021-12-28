import {
  default as ThirdPartyAuth,
  SocialLoginTypes as CE_SocialLoginTypes,
} from "ce/pages/UserAuth/ThirdPartyAuth";
import { getAppsmithConfigs } from "@appsmith/configs";
import { SocialLoginsFactory } from "pages/UserAuth/SocialLoginsFactory";
const { enableGithubOAuth, enableGoogleOAuth } = getAppsmithConfigs();

export const SocialLoginTypes = CE_SocialLoginTypes;

if (enableGoogleOAuth) SocialLoginsFactory.register(SocialLoginTypes.GOOGLE);
if (enableGithubOAuth) SocialLoginsFactory.register(SocialLoginTypes.GITHUB);

export default ThirdPartyAuth;
