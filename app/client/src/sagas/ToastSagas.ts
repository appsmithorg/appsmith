import type { ToastProps } from "design-system";
import { APP_MODE } from "entities/App";
import { select } from "redux-saga/effects";
import { getAppMode } from "@appsmith/selectors/entitiesSelector";
import log from "loglevel";
import { toast as sonnerToast } from "sonner";

interface ExtraOptions {
  // This enables showing of toast no matter the conditions
  forceDisplay?: boolean;
}

/**
 * Shows toast
 * @param message
 * @param [options] These are toast props that toast from design-sytem(react-toastify) library takes
 * @param [extraOtions] These additional options enable the addition of additional requirements, based on which the toast will only then be produced. (for future extensibility as well)
 * @returns
 */
export default function* showToast(
  message: string,
  options?: ToastProps,
  extraOtions?: ExtraOptions,
) {
  const appMode: APP_MODE | undefined = yield select(getAppMode);
  const urlObject = new URL(window?.location?.href);
  const debugFlag = urlObject?.searchParams?.get("debug");
  const debug = debugFlag === "true" || debugFlag;
  if (appMode === APP_MODE.PUBLISHED && !debug && !extraOtions?.forceDisplay) {
    log.error(message);
    return;
  }
  let toastFn = sonnerToast.info;
  switch (options?.kind) {
    case "success":
      toastFn = sonnerToast.success;
      break;
    case "warning":
      toastFn = sonnerToast.warning;
      break;
    case "error":
      toastFn = sonnerToast.error;
      break;
    default:
      break;
  }
  if (options?.action) {
    toastFn(message, {
      action: {
        label: options.action.text,
        onClick: () => options.action?.effect(),
      },
    });
  } else {
    toastFn(message);
  }
}
