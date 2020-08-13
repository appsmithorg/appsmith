import React from "react";
import styled from "styled-components";
import {
  getSocialLoginButtonProps,
  SocialLoginType,
} from "constants/SocialLogin";
import { IntentColors, getBorderCSSShorthand } from "constants/DefaultTheme";
import AnalyticsUtil, { EventName } from "utils/AnalyticsUtil";
import { useLocation } from "react-router-dom";

const ThirdPartyAuthWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;
  margin-left: ${props => props.theme.authCard.dividerSpacing}px;
`;

//TODO(abhinav): Port this to use themes.
const StyledSocialLoginButton = styled.a`
  width: 200px;
  display: flex;
  align-items: center;
  border: ${props => getBorderCSSShorthand(props.theme.borders[2])};
  padding: 8px;
  color: ${props => props.theme.colors.textDefault};
  border-radius: ${props => props.theme.radii[1]}px;
  position: relative;
  height: 42px;

  &:hover {
    text-decoration: none;
    background: ${IntentColors.success};
    color: ${props => props.theme.colors.textOnDarkBG};
  }
  & > div {
    width: 36px;
    height: 36px;
    padding: ${props => props.theme.radii[1]}px;
    position: absolute;
    left: 2px;
    top: 2px;
    background: white;
    display: flex;
    justify-content: center;
    align-items: center;
    & img {
      width: 80%;
      height: 80%;
    }
  }
  & p {
    display: block;
    margin: 0 0 0 36px;
    font-size: ${props => props.theme.fontSizes[3]}px;
    font-weight: ${props => props.theme.fontWeights[3]};
  }
`;

export const SocialLoginTypes: Record<string, string> = {
  GOOGLE: "google",
  GITHUB: "github",
};

type SignInType = "SIGNIN" | "SIGNUP";

const SocialLoginButton = (props: {
  logo: string;
  name: string;
  url: string;
  type: SignInType;
}) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  let url = props.url;
  if (queryParams.has("redirectTo")) {
    url += `?redirectUrl=${queryParams.get("redirectTo")}`;
  }
  return (
    <StyledSocialLoginButton
      href={url}
      onClick={() => {
        let eventName: EventName = "LOGIN_CLICK";
        if (props.type === "SIGNUP") {
          eventName = "SIGNUP_CLICK";
        }
        AnalyticsUtil.logEvent(eventName, {
          loginMethod: props.name.toUpperCase(),
        });
      }}
    >
      <div>
        <img alt={` ${props.name} login`} src={props.logo} />
      </div>
      <p>{`Sign in with ${props.name}`}</p>
    </StyledSocialLoginButton>
  );
};

export const ThirdPartyAuth = (props: {
  logins: SocialLoginType[];
  type: SignInType;
}) => {
  const socialLoginButtons = getSocialLoginButtonProps(props.logins).map(
    item => {
      return <SocialLoginButton key={item.name} {...item} type={props.type} />;
    },
  );
  return <ThirdPartyAuthWrapper>{socialLoginButtons}</ThirdPartyAuthWrapper>;
};

export default ThirdPartyAuth;
