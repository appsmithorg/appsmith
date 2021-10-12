import {
  GoogleOAuthURL,
  GithubOAuthURL,
  KeycloakOAuthURL,
} from "constants/ApiConstants";

import GithubLogo from "assets/images/Github.png";
import GoogleLogo from "assets/images/Google.png";
import KeycloakLogo from "assets/images/Keycloak.png";

export type SocialLoginButtonProps = {
  url: string;
  name: string;
  logo: string;
};

export const GoogleSocialLoginButtonProps: SocialLoginButtonProps = {
  url: GoogleOAuthURL,
  name: "Google",
  logo: GoogleLogo,
};

export const GithubSocialLoginButtonProps: SocialLoginButtonProps = {
  url: GithubOAuthURL,
  name: "Github",
  logo: GithubLogo,
};

export const KeycloakSocialLoginButtonProps: SocialLoginButtonProps = {
  url: KeycloakOAuthURL,
  name: "Keycloak",
  logo: KeycloakLogo,
};

export const SocialLoginButtonPropsList: Record<
  string,
  SocialLoginButtonProps
> = {
  google: GoogleSocialLoginButtonProps,
  github: GithubSocialLoginButtonProps,
  keycloak: KeycloakSocialLoginButtonProps,
};

export type SocialLoginType = keyof typeof SocialLoginButtonPropsList;

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
