import React from "react";
import capitalize from "lodash/capitalize";
import { Slide, toast as toastifyToast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

import type { ToastProps } from "./Toast.types";
import {
  StyledButton,
  StyledPre,
  StyledToast,
  ToastBody,
} from "./Toast.styles";
import { getIconByKind } from "../Icon/getIconByKind";

/**
 * TODO:
 * - Look up accessibility features for toasts (spectrum, MDN, what toastify does and does not support)
 * @constructor
 */

function Toast({ ...rest }: ToastProps) {
  return (
    <StyledToast
      autoClose={5000}
      closeButton={false}
      draggable={false}
      hideProgressBar
      pauseOnHover
      position={toastifyToast.POSITION.TOP_CENTER}
      rtl={false}
      transition={Slide}
      {...rest}
    />
  );
}

// content is of type string and not type ToastContent because we do not want to
// allow developers to pass in their own components.
const toast = {
  show: (content: string, options?: ToastProps) => {
    const actionText = capitalize(options?.action?.text);
    const icon = getIconByKind(options?.kind);
    // generate a unique toastId with the options given to it
    const toastId = JSON.stringify({ ...options, content });

    return toastifyToast(
      <ToastBody kind="body-m">
        <StyledPre>{content}</StyledPre>
        {actionText && (
          <StyledButton
            kind="tertiary"
            onClick={() => {
              options?.action?.effect && options?.action?.effect();
              toastifyToast.dismiss();
            }}
            {...options?.action}
          >
            {actionText}
          </StyledButton>
        )}
      </ToastBody>,
      {
        icon: icon,
        toastId,
        type: options?.kind,
        closeOnClick: !actionText,
        ...options,
      },
    );
  },
  dismiss: () => toastifyToast.dismiss(),
};

Toast.displayName = "Toast";

Toast.defaultProps = {
  kind: undefined,
};

export { Toast, toast };
