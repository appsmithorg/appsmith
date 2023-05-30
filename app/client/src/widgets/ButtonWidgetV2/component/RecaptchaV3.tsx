import React from "react";

import {
  GOOGLE_RECAPTCHA_KEY_ERROR,
  GOOGLE_RECAPTCHA_DOMAIN_ERROR,
  createMessage,
} from "@appsmith/constants/messages";
import type { RecaptchaProps } from "./RecaptchaV2";
import type { RecaptchaType } from "components/constants";
import { useScript, ScriptStatus, AddScriptTo } from "utils/hooks/useScript";

type RecaptchaV3ComponentProps = {
  children: any;
  recaptchaType?: RecaptchaType;
  handleError: (event: React.MouseEvent<HTMLElement>, error: string) => void;
} & RecaptchaProps;

export function RecaptchaV3Component(props: RecaptchaV3ComponentProps) {
  const checkValidJson = (inputString: string): boolean => {
    return !inputString.includes('"');
  };

  const handleBtnClick = (event: React.MouseEvent<HTMLElement>) => {
    if (props.isDisabled) return;
    if (props.isLoading) return;
    if (status === ScriptStatus.READY) {
      (window as any).grecaptcha.ready(() => {
        try {
          (window as any).grecaptcha
            .execute(props.googleRecaptchaKey, {
              action: "submit",
            })
            .then((token: any) => {
              if (typeof props.clickWithRecaptcha === "function") {
                props.clickWithRecaptcha(token);
              }
            })
            .catch(() => {
              // Handle incorrent google recaptcha site key
              props.handleError(
                event,
                createMessage(GOOGLE_RECAPTCHA_KEY_ERROR),
              );
            });
        } catch (err) {
          // Handle error due to google recaptcha key of different domain
          props.handleError(
            event,
            createMessage(GOOGLE_RECAPTCHA_DOMAIN_ERROR),
          );
        }
      });
    }
  };

  let validGoogleRecaptchaKey = props.googleRecaptchaKey;
  if (validGoogleRecaptchaKey && !checkValidJson(validGoogleRecaptchaKey)) {
    validGoogleRecaptchaKey = undefined;
  }
  const status = useScript(
    `https://www.google.com/recaptcha/api.js?render=${validGoogleRecaptchaKey}`,
    AddScriptTo.HEAD,
  );

  return (
    <div className={props.className} onClick={handleBtnClick}>
      {props.children}
    </div>
  );
}
