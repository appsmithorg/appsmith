import { debounce } from "lodash";
import type { TextareaHTMLAttributes } from "react";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import styled from "styled-components";
import useComposedRef from "utils/UseComposeRef";

interface AutoResizeTextAreaStyledProps {
  autoResize: boolean;
}

type AutoResizeTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  AutoResizeTextAreaStyledProps;

const StyledTextArea = styled.textarea<AutoResizeTextAreaStyledProps>`
  padding: 10px;
  box-sizing: border-box;
  width: 100%;
  height: ${(props) => (!props.autoResize ? "100%" : "auto")};
  overflow: ${(props) => (!props.autoResize ? "unset" : "hidden")};
`;

// This proxy textarea will never be visible
// nor it will receive any pointer events
const ProxyTextArea = styled(StyledTextArea)`
  position: absolute;
  height: auto;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  overflow: hidden;
  resize: none;
`;

// Updates the height of the element
// wrt to the scroll height of the proxy element
function updateHeight<T extends HTMLElement | null>({
  autoResize,
  elementRef,
  proxyElementRef,
}: {
  autoResize: boolean;
  elementRef: React.MutableRefObject<T>;
  proxyElementRef: React.MutableRefObject<T>;
}) {
  if (autoResize) {
    const height = proxyElementRef.current?.scrollHeight;

    if (height) {
      if (elementRef.current !== null) {
        elementRef.current.style.height = `${height}px`;
      }
    }
  }
}

const AutoResizeTextArea: React.ForwardRefRenderFunction<
  HTMLTextAreaElement,
  AutoResizeTextAreaProps
> = (props, userRef) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const proxyTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Here we have two refs, one internal and one forwarded to the
  // user, used useComposedRef which gives a single ref to attach
  // to dom node while also set the respective refs.
  const ref = useComposedRef(textAreaRef, userRef);

  // Added resize observer to detect height changes
  // in the proxy textarea
  // this is added to know the height changes when the width
  // of the widget changes which in turn changes the height
  // of the proxy textarea
  const observer = React.useRef(
    new ResizeObserver(
      // Added a debounce of 100
      // Sometimes we change the width very fast
      // so it's better to optimise this
      debounce(() => {
        // As soon as the height of the proxy textarea
        // changes we change the height of the main
        // textarea
        updateHeight({
          autoResize: props.autoResize,
          proxyElementRef: proxyTextAreaRef,
          elementRef: textAreaRef,
        });
      }, 100),
    ),
  );

  useEffect(() => {
    if (proxyTextAreaRef.current) {
      observer.current.observe(proxyTextAreaRef.current);
    }

    return () => {
      if (proxyTextAreaRef.current) {
        observer.current.unobserve(proxyTextAreaRef.current);
      }
    };
  }, []);

  // Update the height of the element
  // when the value changes or
  // whether we want to autoResize or not
  useLayoutEffect(() => {
    updateHeight({
      autoResize: props.autoResize,
      proxyElementRef: proxyTextAreaRef,
      elementRef: textAreaRef,
    });
  }, [props.value, props.autoResize]);

  return (
    <>
      <StyledTextArea {...props} ref={ref} />
      {
        // This is added to get the correct scroll height of a similar
        // textarea which is not displayed on the screen whose height
        // is always auto.
        props.autoResize ? (
          <ProxyTextArea
            autoResize={props.autoResize}
            // making it read only as we will
            // never use this textarea, it's
            // always hidden
            readOnly
            ref={proxyTextAreaRef}
            value={props.value}
          />
        ) : null
      }
    </>
  );
};

export default React.forwardRef(AutoResizeTextArea);
