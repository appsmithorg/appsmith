import React from "react";
import { RecaptchaType, RecaptchaTypes } from "components/constants";

import { Variant, Toaster } from "design-system";
import RecaptchaV2Component from "./RecaptchaV2";
import RecaptchaV3Component from "./RecaptchaV3";

export interface RecaptchaProps {
  googleRecaptchaKey?: string;
  clickWithRecaptcha?: (token: string) => void;
  handleRecaptchaV2Loading?: (isLoading: boolean) => void;
  recaptchaType?: RecaptchaType;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export function withRecaptcha<T extends RecaptchaProps = RecaptchaProps>(
  WrappedComponent: React.ComponentType<T>,
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  function ComponentWithRecaptcha(props: T) {
    if (!props.googleRecaptchaKey) {
      return <WrappedComponent {...props} {...(props as T)} />;
    }

    const handleError = (
      event: React.MouseEvent<HTMLElement>,
      error: string,
    ) => {
      Toaster.show({
        text: error,
        variant: Variant.danger,
      });
      props.onClick && props.onClick(event);
    };

    if (props.recaptchaType === RecaptchaTypes.V2) {
      return (
        <RecaptchaV2Component {...props} handleError={handleError}>
          <WrappedComponent {...props} {...(props as T)} />
        </RecaptchaV2Component>
      );
    } else {
      return (
        <RecaptchaV3Component {...props} handleError={handleError}>
          <WrappedComponent {...props} {...(props as T)} />
        </RecaptchaV3Component>
      );
    }
  }

  ComponentWithRecaptcha.displayName = `withRecaptcha(${displayName})`;

  return ComponentWithRecaptcha;
}
