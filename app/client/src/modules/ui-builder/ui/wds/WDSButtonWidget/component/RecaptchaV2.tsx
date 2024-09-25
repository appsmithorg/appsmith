import React from "react";
import { noop } from "lodash";
import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

import {
  GOOGLE_RECAPTCHA_KEY_ERROR,
  GOOGLE_RECAPTCHA_DOMAIN_ERROR,
  createMessage,
} from "ee/constants/messages";
import type { RecaptchaProps } from "./useRecaptcha";

export type RecaptchaV2Props = RecaptchaProps;

export function RecaptchaV2(props: RecaptchaV2Props) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isInvalidKey, setInvalidKey] = useState(false);
  const handleRecaptchaLoading = (isloading: boolean) => {
    props.handleRecaptchaV2Loading && props.handleRecaptchaV2Loading(isloading);
  };
  const {
    isDisabled,
    isLoading,
    onPress: onClickProp,
    onRecaptchaSubmitError = noop,
    onRecaptchaSubmitSuccess,
    recaptchaKey,
  } = props;
  const onClick = () => {
    if (isDisabled) return onClickProp;

    if (isLoading) return onClickProp;

    if (isInvalidKey) {
      // Handle incorrent google recaptcha site key
      onRecaptchaSubmitError(createMessage(GOOGLE_RECAPTCHA_KEY_ERROR));
    } else {
      handleRecaptchaLoading(true);
      recaptchaRef?.current?.reset();
      recaptchaRef?.current
        ?.executeAsync() // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((token: any) => {
          if (token) {
            if (typeof onRecaptchaSubmitSuccess === "function") {
              onRecaptchaSubmitSuccess(token);
            }
          } else {
            // Handle incorrent google recaptcha site key
            onRecaptchaSubmitError(createMessage(GOOGLE_RECAPTCHA_KEY_ERROR));
          }

          handleRecaptchaLoading(false);
        })
        .catch(() => {
          handleRecaptchaLoading(false);
          // Handle error due to google recaptcha key of different domain
          onRecaptchaSubmitError(createMessage(GOOGLE_RECAPTCHA_DOMAIN_ERROR));
        });
    }
  };

  const recaptcha = (
    <ReCAPTCHA
      onErrored={() => setInvalidKey(true)}
      ref={recaptchaRef}
      sitekey={recaptchaKey || ""}
      size="invisible"
    />
  );

  return { onClick, recaptcha };
}
