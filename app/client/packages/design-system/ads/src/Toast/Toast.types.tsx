import type { ToastOptions } from "react-toastify";
import type { ButtonProps } from "../Button/Button.types";
import type { Kind } from "../__config__/types";

export type ToastKind = Kind;

export type ToastProps = {
  /** visual style to be used indicating type of toast */
  kind?: ToastKind;
  /** An object that displays an action that can be triggered from the toast */
  action?: {
    /** One word describing an action a user may perform upon seeing the toast */
    text: string;
    /** A function that carries out the action */
    effect: any;
  } & ButtonProps;
} & ToastOptions;
