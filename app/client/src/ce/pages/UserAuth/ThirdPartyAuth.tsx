import React from "react";
import styled from "styled-components";
import {
  getSocialLoginButtonProps,
  SocialLoginType,
} from "@appsmith/constants/SocialLogin";
import { getTypographyByKey } from "constants/DefaultTheme";
import AnalyticsUtil, { EventName } from "utils/AnalyticsUtil";
import { useLocation } from "react-router-dom";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

const ThirdPartyAuthWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

//TODO(abhinav): Port this to use themes.
const StyledSocialLoginButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  border: solid 1px ${(props) => props.theme.colors.auth.socialBtnBorder};
  margin-bottom: ${(props) => props.theme.spaces[4]}px;

  &:only-child, &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    text-decoration: none;
    background-color: ${(props) => props.theme.colors.auth.socialBtnHighlight};
  }

  & .login-method {
    ${(props) => getTypographyByKey(props, "btnLarge")}
    color: ${(props) => props.theme.colors.auth.socialBtnText};
    text-transform: uppercase;
  }
`;

const ButtonLogo = styled.img`
  margin: ${(props) => props.theme.spaces[2]}px;
  width: 24px;
`;

export const SocialLoginTypes = {
  GOOGLE: "google",
  GITHUB: "github",
};

type SignInType = "SIGNIN" | "SIGNUP";

function SocialLoginButton(props: {
  logo: string;
  name: string;
  url: string;
  label?: string;
  type: SignInType;
}) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  let url = props.url;
  const redirectUrl = queryParams.get("redirectUrl");
  if (redirectUrl != null) {
    url += `?redirectUrl=${encodeURIComponent(redirectUrl)}`;
  }
  return (
    <StyledSocialLoginButton
      href={url}
      onClick={() => {
        let eventName: EventName = "LOGIN_CLICK";
        if (props.type === "SIGNUP") {
          eventName = "SIGNUP_CLICK";
        }
        PerformanceTracker.startTracking(
          eventName === "SIGNUP_CLICK"
            ? PerformanceTransactionName.SIGN_UP
            : PerformanceTransactionName.LOGIN_CLICK,
          { name: props.name.toUpperCase() },
        );
        AnalyticsUtil.logEvent(eventName, {
          loginMethod: props.name.toUpperCase(),
        });
      }}
    >
      <ButtonLogo alt={` ${props.name} login`} src={props.logo} />
      <div className="login-method" data-testid={`login-with-${props.name}`}>
        {props.label ?? `continue with ${props.name}`}
      </div>
    </StyledSocialLoginButton>
  );
}

export function ThirdPartyAuth(props: {
  logins: SocialLoginType[];
  type: SignInType;
}) {
  const socialLoginButtons = getSocialLoginButtonProps(props.logins).map(
    (item) => {
      return <SocialLoginButton key={item.name} {...item} type={props.type} />;
    },
  );
  return <ThirdPartyAuthWrapper>{socialLoginButtons}</ThirdPartyAuthWrapper>;
}

export default ThirdPartyAuth;
