export * from "ce/constants/SocialLogin";
import type {
  SocialLoginButtonProps,
  SocialLoginType,
} from "ce/constants/SocialLogin";
import { SocialLoginButtonPropsList } from "ce/constants/SocialLogin";

export const getSocialLoginButtonProps = (
  logins: SocialLoginType[],
): SocialLoginButtonProps[] => {
  return logins.map((login) => {
    const socialLoginButtonProps = SocialLoginButtonPropsList[login];
    if (!socialLoginButtonProps) {
      throw Error("Social login not registered: " + login);
    }
    return socialLoginButtonProps;
  });
};
