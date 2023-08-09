import React from "react";
import styled from "styled-components";
import type { SocialLoginType } from "@appsmith/constants/SocialLogin";
import { getSocialLoginButtonProps } from "@appsmith/constants/SocialLogin";
import type { EventName } from "@appsmith/utils/analyticsUtilTypes";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useLocation } from "react-router-dom";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { Button } from "design-system";

const ThirdPartyAuthWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-3);
`;

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
    <Button
      href={url}
      kind="secondary"
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
      renderAs="a"
      size="md"
      startIcon={
        ["Google", "Github"].includes(props.name)
          ? props.name.toLowerCase() + `-fill`
          : "key-2-line"
      }
    >
      <div className="login-method" data-testid={`login-with-${props.name}`}>
        {props.label ?? `Continue with ${props.name}`}
      </div>
    </Button>
  );
}

function ThirdPartyAuth(props: {
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
