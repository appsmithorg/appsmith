import GithubLogo from "assets/images/Github.png";
import GoogleLogo from "assets/images/Google.png";
import { GithubOAuthURL, GoogleOAuthURL } from "ee/constants/ApiConstants";

export interface SocialLoginButtonProps {
  url: string;
  name: string;
  logo: string;
  label?: string;
}

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

export const SocialLoginButtonPropsList: Record<
  string,
  SocialLoginButtonProps
> = {
  google: GoogleSocialLoginButtonProps,
  github: GithubSocialLoginButtonProps,
};

export type SocialLoginType = keyof typeof SocialLoginButtonPropsList;
