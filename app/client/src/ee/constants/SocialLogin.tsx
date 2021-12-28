export * from "ce/constants/SocialLogin";
import {
  SocialLoginButtonProps,
  SocialLoginButtonPropsList,
  SocialLoginType,
} from "ce/constants/SocialLogin";

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
