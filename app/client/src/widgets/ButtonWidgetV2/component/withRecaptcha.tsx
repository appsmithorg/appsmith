import React from "react";
import { RecaptchaTypes } from "components/constants";

import { toast } from "design-system";
import type { RecaptchaProps } from "./RecaptchaV2";
import { RecaptchaV2Component } from "./RecaptchaV2";
import { RecaptchaV3Component } from "./RecaptchaV3";

export function withRecaptcha<T extends RecaptchaProps = RecaptchaProps>(
  WrappedComponent: React.ComponentType<T>,
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  function ComponentWithRecaptcha(props: T) {
    const hasOnClick = Boolean(
      props.onClick && !props.isLoading && !props.isDisabled,
    );

    if (!props.googleRecaptchaKey) {
      return (
        <div
          className={props.className}
          onClick={hasOnClick ? props.onClick : undefined}
          style={{ height: "100%" }}
        >
          <WrappedComponent {...props} {...(props as T)} />
        </div>
      );
    }

    if (!props.googleRecaptchaKey) {
      return <WrappedComponent {...props} {...(props as T)} />;
    }

    const handleError = (
      event: React.MouseEvent<HTMLElement>,
      error: string,
    ) => {
      toast.show(error, {
        kind: "error",
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
