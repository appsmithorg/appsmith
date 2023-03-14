import { throttle } from "lodash";
import { useLayoutEffect, useRef } from "react";

type UseFixedFooterProps = {
  fixedFooter: boolean;
  activeClassName: string;
  ref: React.MutableRefObject<HTMLDivElement | null>;
};

const ERROR_MARGIN = 2;

const scrolledToBottom = (element: HTMLElement) => {
  const { clientHeight, scrollHeight, scrollTop } = element;
  return scrollHeight - scrollTop - clientHeight < ERROR_MARGIN;
};

const hasOverflowingContent = (element: HTMLElement) => {
  const { clientHeight, scrollHeight } = element;
  return scrollHeight - clientHeight > ERROR_MARGIN;
};

const THROTTLE_TIMEOUT = 50;

function useFixedFooter<
  HTMLDivElement extends HTMLElement,
  TFooterElement extends HTMLElement = HTMLDivElement
>({ activeClassName, fixedFooter, ref }: UseFixedFooterProps) {
  const bodyRef = ref;
  const footerRef = useRef<TFooterElement>(null);

  const isOverflowing = bodyRef.current
    ? hasOverflowingContent(bodyRef.current)
    : false;

  const applyScrollClass = (element: HTMLElement, shouldApply: boolean) => {
    shouldApply
      ? element.classList.add(activeClassName)
      : element.classList.remove(activeClassName);
  };

  useLayoutEffect(() => {
    const onScrollOrResize = throttle(() => {
      if (fixedFooter && footerRef.current && bodyRef.current) {
        const hasScrolledToBottom = scrolledToBottom(bodyRef.current);
        applyScrollClass(footerRef.current, !hasScrolledToBottom);
      }
    }, THROTTLE_TIMEOUT);

    if (bodyRef.current) {
      const resizeObserver = new ResizeObserver(onScrollOrResize);
      resizeObserver.observe(bodyRef.current);
      bodyRef.current.addEventListener("scroll", onScrollOrResize);
    }

    return () => {
      if (bodyRef.current) {
        bodyRef.current.removeEventListener("scroll", onScrollOrResize);
      }
    };
  }, []);

  /**
   * If fixedFooter changes from false to true and not scrolled to the bottom
   * then we add the active class to the footer.
   */
  useLayoutEffect(() => {
    if (fixedFooter && footerRef.current && bodyRef.current) {
      const hasScrolledToBottom = scrolledToBottom(bodyRef.current);
      const shouldApplyClass = !hasScrolledToBottom && isOverflowing;
      applyScrollClass(footerRef.current, shouldApplyClass);
    }
  }, [fixedFooter, isOverflowing]);

  return {
    bodyRef,
    footerRef,
  };
}

export default useFixedFooter;
