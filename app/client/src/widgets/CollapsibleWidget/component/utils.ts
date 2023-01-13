import { RefObject } from "react";

export const noop = () => {
  return;
};

export function getElementHeight(
  el: RefObject<HTMLElement> | { current?: { scrollHeight: number } },
): string | number {
  if (!el?.current) {
    return "auto";
  }

  return el.current.scrollHeight;
}

type AnyFunction = (...args: any[]) => unknown;

export const callAll = (...fns: AnyFunction[]) => (...args: any[]): void =>
  fns.forEach((fn) => fn && fn(...args));
