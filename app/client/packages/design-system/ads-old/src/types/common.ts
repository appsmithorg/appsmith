export interface CommonComponentProps {
  isLoading?: boolean; //default false
  cypressSelector?: string;
  className?: string;
  name?: string;
  disabled?: boolean; //default false
}

export enum LabelPosition {
  Auto = "Auto",
  Top = "Top",
  Left = "Left",
  Right = "Right",
}

export const DS_EVENT = "DS_EVENT";

export enum DSEventTypes {
  KEYPRESS = "KEYPRESS",
}

export interface DSEventDetail {
  component: string;
  event: DSEventTypes;
  meta: Record<string, unknown>;
}

export function createDSEvent(detail: DSEventDetail) {
  return new CustomEvent(DS_EVENT, {
    bubbles: true,
    detail,
  });
}

export function emitDSEvent<T extends HTMLElement>(
  element: T | null,
  args: DSEventDetail,
) {
  element?.dispatchEvent(createDSEvent(args));
}

export enum SubTextPosition {
  BOTTOM,
  LEFT,
}

export enum ToastTypeOptions {
  success = "success",
  info = "info",
  warning = "warning",
  error = "error",
}
