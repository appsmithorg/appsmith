import { noop } from "lodash";

import {
  GOOGLE_RECAPTCHA_KEY_ERROR,
  GOOGLE_RECAPTCHA_DOMAIN_ERROR,
  createMessage,
} from "@appsmith/constants/messages";
import type { ButtonComponentProps } from ".";
import type { RecaptchaProps } from "./useRecaptcha";
import { useScript, ScriptStatus, AddScriptTo } from "utils/hooks/useScript";

type RecaptchaV3Props = RecaptchaProps;

export function RecaptchaV3(props: RecaptchaV3Props) {
  const checkValidJson = (inputString: string): boolean => {
    return !inputString.includes('"');
  };

  const {
    onPress: onClickProp,
    onRecaptchaSubmitError = noop,
    onRecaptchaSubmitSuccess,
    recaptchaKey,
  } = props;

  const onClick: ButtonComponentProps["onPress"] = () => {
    if (props.isDisabled) return onClickProp;
    if (props.isLoading) return onClickProp;

    if (status === ScriptStatus.READY) {
      (window as any).grecaptcha.ready(() => {
        try {
          (window as any).grecaptcha
            .execute(recaptchaKey, {
              action: "submit",
            })
            .then((token: any) => {
              if (typeof onRecaptchaSubmitSuccess === "function") {
                onRecaptchaSubmitSuccess(token);
              }
            })
            .catch(() => {
              // Handle incorrent google recaptcha site key
              onRecaptchaSubmitError(createMessage(GOOGLE_RECAPTCHA_KEY_ERROR));
            });
        } catch (err) {
          // Handle error due to google recaptcha key of different domain
          onRecaptchaSubmitError(createMessage(GOOGLE_RECAPTCHA_DOMAIN_ERROR));
        }
      });
    }
  };

  let validGoogleRecaptchaKey = recaptchaKey;
  if (validGoogleRecaptchaKey && !checkValidJson(validGoogleRecaptchaKey)) {
    validGoogleRecaptchaKey = undefined;
  }
  const status = useScript(
    `https://www.google.com/recaptcha/api.js?render=${validGoogleRecaptchaKey}`,
    AddScriptTo.HEAD,
  );

  return { onClick };
}
